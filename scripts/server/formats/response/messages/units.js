const z = require(`zod`).z;
const MessagingTypes = require(`../../../../messaging/messages.js`);
const Template = require(`../template.js`);

/**
 * Viewing response format
 * @class AddedViewingResponse
 * @extends Template.ObjectResponseData
 * @property {String|Number} _id - Message ID
 * @property {String} text - Message text
 * @property {Date} created_on - The creation date
 */
class ViewingMessagesResponse extends Template.ObjectResponseData {
	/**
	 * @param {MessagingTypes.Message} data - the message to import from
	 */
	_import(data) {
		this._id = data._id;
		this.text = data instanceof MessagingTypes.DeletedMessage ? `[deleted]` : data.text;
		this.created_on = data.created_on;
	};

	/**
	 * @constructor
	 * @param {MessagingTypes.Message} data - the message to create the response from
	 */
	constructor(data) {
		super(data);
	};
};

/**
 * Added message response format
 * @class AddedMessagesResponse
 * @extends ViewingMessagesResponse
 * @property {String} delete_password - The deletion password
 * @property {Boolean} reported - The reported status
 */
class AddedMessagesResponse extends ViewingMessagesResponse {
	/**
	 * @param {MessagingTypes.Message} data - the message to import from
	 */
	_import(data) {
		super._import(...arguments);
		this.delete_password = data.delete_password;
		this.reported = data.flagged;
	};

	/**
	 * @constructor
	 * @param {MessagingTypes.Message} data - the message to create the response from
	 */
	constructor(data) {
		super(data);
	};
};

/**
 * Viewing thread response format
 * @class ViewingThreadResponse
 * @extends Template
 * @property {String|Number} _id - Thread ID
 * @property {String} text - Thread text
 * @property {Date} created_on - Creation date
 * @property {Date} bumped_on - Bumped date
 * @property {ViewingMessagesResponse[]} replies - Replies
 */
class ViewingThreadResponse extends Template.ObjectResponseData {
	/**
	 * @constructor
	 * @param {MessagingTypes.MessageThread} data - the thread to create the response from
	 * @param {Number} size - the message preview length
	 */
	constructor(data, size) {
		return super(...arguments);
	};

	/**
	 * @param {MessagingTypes.MessageThread} data - the thread to import from
	 * @param {Number} size - the size
	 */
	_import(data, size) {
		this._id = data._id;
		this.text = data.text;
		this.created_on = data.created_on;
		this.bumped_on = data.bumped_on;
		this.replies = data.messages.map(
			(message) => (new ViewingMessagesResponse(message))
		)
		
		if (z.number().int().safeParse(size).success) {
			this.replies = this.replies.slice(-size); // slice by size
		};
	};
};

/**
 * New thread response format
 * @class AddedThreadResponse
 * @extends ViewingThreadResponse
 * @property {String} delete_password - The deletion password
 * @property {Boolean} reported - The reported status
 */
class AddedThreadResponse extends ViewingThreadResponse {
	/**
	 * @constructor
	 * @param {MessagingTypes.MessageThread} data - the thread to create the response from
	 */
	constructor(data) {
		super(...arguments);
	};

	/**
	 * @param {MessagingTypes.MessageThread} data - the thread to import from
	 */
	_import(data) {
		super._import(...arguments);
		this.reported = data.flagged;
		this.delete_password = data.delete_password;
	}

};

/**
 * A board view
 * @class Board_View
 * @extends Template.ResponseData
 * @property {MessagingTypes.MessageBoard} board - The message board
 */
class Board_View extends Template.ResponseData {
	/**
	 * The search size
	 * 
	 * If positive, it will return the most recent threads. If negative, the least recent threads will be returned. By default, the top 10 most recent threads will be returned. 
	 * 
	 * @type {Number}
	 */
	size = 10; 

	/**
	 * The top/last `size` messages
	 * @property {ViewingThreadResponse[]} content - The threads in the board
	 */
	get content() {
		let result = this.board.find(undefined, this.size || 10);
		return result.map((thread) => (new ViewingThreadResponse(thread, 3)));
	};

	/**
	 * @constructor
	 * @param {MessagingTypes.MessageBoard} data - the board to create the response from
	 */
	constructor(data) {
		return super(...arguments);
	};

	/**
	 * @param {MessagingTypes.MessageBoard} data - the board to create the response from
	 */
	_import(data) {
		data && (this.board = z.instanceof(MessagingTypes.MessageBoard).parse(data));
		return this;
	};
};

/**
 * Replies view
 * @class Replies_View
 * @extends Template.ResponseData
 * @property {MessagingTypes.MessageThread} thread - The message thread
 * @property {ViewingMessagesResponse[]} messages - The messages in the thread
 * 
 */
class Replies_View extends Template.ResponseData {
	/**
	 * @constructor
	 * @param {MessagingTypes.MessageThread} data
	 */
	constructor(data) {
		return super(...arguments);
	};
	
	_init(data) {
		this.thread = z.instanceof(MessagingTypes.MessageThread).parse(value); 
		this.messages = this.thread.messages.map((message) => (new ViewingMessagesResponse(message))); 
		return this;
	};
	
	get content() {
		return this.messages
	};
};

module.exports = {ViewingMessagesResponse, AddedMessagesResponse, ViewingThreadResponse, AddedThreadResponse, Board_View};