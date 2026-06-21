/**
 * @file message.js
 * Message model for the message board application
 *
 * @module Message
 */

const zod = require('zod');
const { object } = require('zod/v3');

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
	 * @type {array}
	 */
	children = [];

	/**
	 * Tags
	 * @type {array}
	 */
	tags = [];

	/**
	 * Creates or copies a message.
	 * 
	 * @param {Message|string} content - the message to copy from
	 * @param {string} content.text - the message text to copy
	 * @param {string} content.title - the message title to copy
	 * @param {dict} content.dates - the message dates to include
	 * @param {Date} content.dates.created - the message created date
	 * @param {Date} content.dates.updated - the message updated date
	 * @param {array} content.children - the message children to copy
	 * @param {array} content.tags - the message tags to copy
	 * @param {string} content - if content is a string, it will be used as the message text
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
				"author": content?.author && zod.coerce.number().safeParse(content?.author)
			};

			/**
			 * Maps fields to copy functions
			 */
			let copier = {
				"_id": this._id, "text": this.text, "title": this.title, "date": this.dates, "children": this.children, "tags": this.tags, "author": this.author
			};

			Object.entries(copier).forEach(
				/**
				 *
				 * @param {String} attribute - the attribute name
				 * @param {*} reference - the reference to the corresponding attribute in the message object
				 */
				(attribute, reference) => {
					if (copy[attribute]?.success) {
						reference = copy[attribute].data;
					};
				});
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
	/**
	 * @private
	 * @type {String}
	 * The reaction type
	 */
	#reaction;

	/**
	 * The reaction type
	 * @type {String}
	 */
	get text() {
		return this.#reaction;
	};
	set text(value) {
		this.#reaction = value ? zod.emoji().parse(value) : null;
	};

	constructor(content) {
		super(content);
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
