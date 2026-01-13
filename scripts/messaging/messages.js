const z = require(`zod`).z;
const AuthKey = require(`../security/key.js`);

/**
 * Compare whether or not the instance and the copy are identical, at least by ID. 
 * 
 * @function compare
 * @param {Pigeon} copy - the copy
 * @param {Pigeon} instance - the instance of focus
 * @returns {Boolean} whether or not they’re identical
 */
function compare(instance, copy) {
	return ((instance == copy) || (instance._id == copy._id));
}

/**
 * A messaging entity; the parent class for Message and MessageThread
 * 
 * @class Pigeon
 */
class Pigeon {
	/**
	 * ID
	 * @type {Number}
	 */
	_id; 

	/**
	 * Creation date
	 * @private
	 * @type {Date}
	 */
	#created_on; 

	/**
	 * Creation date
	 * @type {Date}
	 */
	get created_on() {
		return (this.#created_on)
			? this.#created_on
			: (
				/**
				 * Generate the creation date. 
				 * @returns {Date} the generation date. 
				 */
				() => {
					let date = new Date();
					this.#created_on = date;
					return (date);
			})();
	};
	/**
	 * @param {Date|String|Number} date the input date
	 */
	set created_on(date) {
		this.#created_on = date ? (([z.number().gte(0), z.iso.datetime(), z.iso.date()].some(
			/**
			 * Test if the input pertains to some date and time
			 * @param validator the Zod validator
			 * @returns {Boolean} whether the validation matched
			 */
			(validator) => (validator.safeParse(date).success)))
			? new Date(date)
			: z.date().parse(date)) : undefined;
		return (this.#created_on);
	};

	/**
	 * Text content
	 * @type {String}
	 */
	text;

	/**
	 * Flagged
	 * @type {Boolean}
	 * @private
	 */
	#flagged = false; 

	/**
	 * Flagged
	 * @type {Boolean}
	 */
	get flagged() {return this.#flagged};
	set flagged(state) {
		this.#flagged = new Boolean(state);
		return this.#flagged;
	};

	/**
	 * Prepares a messaging entity
	 * @constructor
	 * @param {Pigeon} properties - the properties
	 */
	constructor(properties) {
		z.object({}).loose().safeParse(properties).success && (
			/**
			 * Attempts importing data from properties
			 * @function
			 */
			() => {
			properties?.created_on && (this.created_on = properties.created_on); // Import the creation date
			this._id = properties?._id ? properties._id : new Number(this.created_on); // Then, set the ID
			properties?.flagged && (this.flagged = properties.flagged);
			properties?._key && (this._key = properties._key); // Obfuscates in the process
			properties && Object.entries(properties).forEach((item) => (Object.keys(this).includes(item[0]) && (this[item[0]] = item[1]))); // Import all other properties
		})();
	};

	/**
	 * The authentication key
	 * @private
	 * @type {AuthKey}
	 */
	#key; 

	/**
	 * The authentication key
	 * @protected
	 * @type {AuthKey}
	 */
	get _key() {
		return this.#key;
	}
	/**
	 * @param {String} value user password or existing hash
	 */
	set _key(value) {
		this.#key = (value && ((value instanceof AuthKey) ? value : (new AuthKey(value)))) || undefined;
	};
};

/**
 * A message
 * @class Message
 * @extends Pigeon
 */
class Message extends Pigeon {
	/**
	 * @constructor
	 * @param {Message} properties - the properties
	 */
	constructor(properties) {
		super(properties);
		properties?.text && (this.text = properties?.text);
	};

	/**
	 * Message content
	 */
	text;
};

/**
 * A deleted message
 * @class DeletedMessage
 * @extends Message
 */
class DeletedMessage extends Message {
	constructor(properties) {
		super(properties);
	};
};

class MessageThread extends Pigeon {
	constructor(properties) {
		super(properties);
	};

	/**
	 * Thread description
	 */
	text; 

	/**
	 * The messages
	 * @private
	 * @type {Message[]|DeletedMessage[]}
	 */
	#messages = [];

	/**
	 * The message
	 * @type {Message[]|DeletedMessage[]}
	 */
	get messages () {return (this.#messages);};
	set messages (messages_list) {
		this.#messages = z.array(z.any).parse(messages_list).filter(
			/**
			 * Filters out invalid messages.
			 * @param {Message|DeletedMessage|*} message - the message
			 * @returns {Boolean} the validity of the message; only valid messages will be added to the messages array
			 */
			(message) => ([Message, DeletedMessage].some((type) => (z.instanceof(type).safeParse(message).success))))
		return (this.#messages);
	};

	/**
	 * Last update
	 * @type {Date}
	 */
	get bumped_on() {
		return ((this.#messages.length && this.#messages.slice(-1)[0]?.created_on) || this.created_on);
	};

	/**
	 * Deletes a message
	 * 
	 * @function delete
	 * @param {Message|String} message - the message or the message ID to delete
	 * @param {String} key - the management key
	 * @returns {Boolean|undefined} true if successfully deleted, false if already deleted, or undefined if not found
	 * @throws {import('common-errors').AuthenticationRequiredError} when authentication fails
	 */
	delete(message, key) {
		let found = this.find(message);
		return (found && (() => {
			found?._key && (found._key.input = key);

			if (found instanceof DeletedMessage) {
				return false; // it’s already deleted
			};

			for (let index = 0; index < this.#messages.length; index++) { // Replace the instance on the list
				if (found == this.#messages[index]) {
					this.#messages[index] = new DeletedMessage(this.#messages[index]);
					return true;
				};
			};
		})());
	};

	/**
	 * Search for a message. 
	 * 
	 * @function find
	 * @param {Message|DeletedMessage|String|Number|Date} message - The message to search. If not provided, all messages will be returned as an alias of messages
	 * @returns {Message|DeletedMessage|undefined} the message, or undefined if not found (doesn’t throw an error)
	 */
	find(message) {
		return message ? this.#messages.filter(
			([Message, DeletedMessage].some((type) => (message instanceof type))) ? 
				/**
				 * Boolean search for the instance
				 * @param contained_message the message
				 * @returns {Boolean} true if the message was found, even by ID
				 */
				(contained_message) => (
					compare(contained_message, message)
				) : 
				/**
				 * Filter the messages by name or creation ID
				 * @param contained_message the message
				 * @returns {Boolean} true if matching
				 */
				(contained_message) => ([contained_message._id, contained_message.created_on].some(
					/**
					 * Verify if the data’s ID or date matches
					 * @param data 
					 * @returns {Boolean}
					 */
					(data) => (data == message)))
		)[0] : this.#messages;
	};

	/**
	 * Flag a message. 
	 * @param {Message|String|Number} 
	 * @returns {Boolean|undefined} true if the thread was flagged; false if not changed; undefined if not found
	 */
	flag(message) {
		let found = this.find(message);
		return found ? (() => {
			found.flagged = true;
			return this.find(message)?.flagged;
		}) : found;
	};
};

class MessageBoard extends Pigeon {
	/**
	 * The message threads
	 * @type {Set<MessageThread>}
	 */
	threads = new Set();

	/**
	 * Message board’s description
	 */
	text;

	/**
	 * Deletes a thread
	 * 
	 * @function delete
	 * @param {MessageThread|String|Number} thread - the message thread (or its thread) to delete
	 * @param {String} key - the management key
	 * @returns {Boolean|undefined} true if the thread was deleted; undefined if not found
	 */
	delete(thread, key) {
		let found = this.find(thread);
		
		return found ? (() => {
			found._key.input = key; // Attempt authentication; will not continue when an error occurs
			this.threads.delete(found);
			return (true);
		}) : found;
	};

	/**
	 * Flag a thread
	 * 
	 * @function flag
	 * @param {MessageThread|String|Number} 
	 * @returns {Boolean|undefined} true if the thread was flagged; false if not changed; undefined if not found
	 */
	flag(thread) {
		let found = this.find(thread);

		return found ? (() => {
			found.flagged = true;
			return (this.find(thread)?.flagged);
		})() : found;
	};

	/**
	 * Search for a message. 
	 * 
	 * @function find
	 * @param {MessageThread|String|Number|Date} thread - The message to search. If not provided, all messages will be returned as an alias of messages
	 * @returns {MessageThread|undefined} the message or undefined if not found (doesn’t throw an error)
	 */
	find(thread) {
		return Array.from(this.threads).filter((thread instanceof MessageThread)
			? ((threads) => (compare(thread, threads)))
			: ((threads) => ([threads._id, threads.created_on].some((value) => (value == thread))))
		)[0];
	};
}

Message.parent = MessageThread;
MessageThread.parent = MessageBoard;

module.exports = {Message, MessageThread, MessageBoard}