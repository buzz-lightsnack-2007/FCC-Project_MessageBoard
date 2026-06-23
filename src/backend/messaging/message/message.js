/**
 * @file message.js
 * Message model for the message board application
 *
 * @module Message
 */

const zod = require('zod');

/**
 * @class Message
 * A message
 */
class Message {
	/**
	 * Message ID
	 * @type {number}
	 */
	_id;

	/**
	 * Author's user ID
	 * @type {number}
	 */
	author;

	/**
	 * The message title
	 * @type {string}
	 */
	title;

	/**
	 * The message body / text
	 * @type {string}
	 */
	text;

	/**
	 * The created and updated dates of the message
	 * @type {dict}
	 */
	dates = {
		/**
		 * The date the message was created
		 * @type {Date}
		 */
		created: new Date(),
		/**
		 * The date the message was last updated
		 * @type {Date}
		 */
		updated: new Date(),
	};

	/**
	 * The children of the message
	 * @type {Message[]|Number[]}
	 */
	children = [];

	/**
	 * Tags
	 * @type {array}
	 */
	tags = [];

	/**
	 * Deleted or hidden
	 * @type {boolean}
	 */
	hidden = false;

	/**
	 * Creates or copies a message.
	 * 
	 * @param {Message|string} content - the message to copy from
	 * @param {string} content.text - the message text to copy
	 * @param {string} content.title - the message title to copy
	 * @param {dict} content.dates - the message dates to include
	 * @param {Date} content.dates.created - the message created date
	 * @param {Date} content.dates.updated - the message updated date
	 * @param {Number[]} content.children - the message children to copy. Note here that children are stored as an array of message IDs, not message objects; you can just swap them out later. 
	 * @param {array} content.tags - the message tags to copy
	 * @constructor
	 */
	constructor(content) {
		if (content instanceof Object) {
			/**
			 * Determines whether to copy fields
			 */
			let copy = {
				"_id": content?._id && zod.coerce.number().safeParse(content?._id),
				"text": content?.text && zod.coerce.string().safeParse(content.text),
				"title": content?.title && zod.coerce.string().safeParse(content.title),
				"date": content?.dates && zod.object({
					created: zod.coerce.date().safeParse(content.dates?.created),
					updated: zod.coerce.date().safeParse(content.dates?.updated)
				}).safeParse(content.dates),
				"children": content?.children && zod.array(zod.coerce.number()).safeParse(content?.children),
				"tags": content?.tags && zod.array(zod.coerce.string()).safeParse(content?.tags),
				"author": content?.author && zod.coerce.number().safeParse(content?.author),
				"hidden": zod.coerce.boolean().safeParse(content?.hidden)
			};

			this._id = copy._id?.data || undefined;
			this.text = copy.text?.data || undefined;
			this.title = copy.title?.data || undefined;
			this.dates = copy.date?.data || { created: new Date(), updated: new Date() };
			this.children = copy.children?.data || [];
			this.tags = copy.tags?.data || [];
			this.author = copy.author?.data || undefined;
			this.hidden = copy.hidden?.data || false;
		} else if (content && zod.coerce.string().safeParse(content).success) {
			this.text = content;
		};
	};
}

/**
 * A reaction
 * @class Reaction
 * @extends Message
 */
class Reaction extends Message {
	constructor(content) {
		super(content);

		this.text = (content instanceof Object ? content?.text : content) ? zod.emoji().parse(content instanceof Object ? content.text : content) : null; 
	};
};

/**
 * A message thread, or a top-level message
 * @class Thread
 * @extends Message
 */
class Thread extends Message {
	constructor(content) {
		super(content);
	};
}

module.exports = {
	Message,
	Reaction,
	Thread
};
