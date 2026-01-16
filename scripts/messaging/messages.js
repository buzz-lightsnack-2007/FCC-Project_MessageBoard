const z = require(`zod`).z;
const AuthKey = require(`../security/key.js`);
const Errors = require(`./errors.js`);
const Statuses = require(`./status.js`);

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
     * @protected
     * @type {Date}
     */
    _created_on; 

    /**
     * Creation date
     * @type {Date}
     */
    get created_on() {
        return (this._created_on)
            ? this._created_on
            : (
                /**
                 * Generate the creation date. 
                 * @returns {Date} the generation date. 
                 */
                () => {
                    let date = new Date();
                    this._created_on = date;
                    return (date);
            })();
    };
    /**
     * @param {Date|String|Number} date the input date
     */
    set created_on(date) {
        this._created_on = date ? (([z.number().gte(0), z.iso.datetime(), z.iso.date()].some(
            /**
             * Test if the input pertains to some date and time
             * @param validator the Zod validator
             * @returns {Boolean} whether the validation matched
             */
            (validator) => (validator.safeParse(date).success)))
            ? new Date(date)
            : z.date().parse(date)) : undefined;
        return (this._created_on);
    };

    /**
     * Text content
     * @type {String}
     */
    text;

    /**
     * Flagged
     * @type {Boolean}
     */
    flagged = false; 
	
    /**
     * Prepares a messaging entity
     * @constructor
     * @param {Pigeon} properties - the properties
     */
    constructor(properties) {
        if (z.object({}).loose().safeParse(properties).success) {
            properties?.created_on && (this.created_on = properties.created_on); // Import the creation date
            this._id = properties?._id ? properties._id : new Number(this.created_on); // Then, set the ID
            properties?.flagged && (this.flagged = properties.flagged);
            properties?._key && (this._key = properties._key); // Obfuscates in the process
            properties && Object.entries(properties).forEach((item) => (Object.keys(this).includes(item[0]) && (this[item[0]] = item[1]))); // Import all other properties
        } else if (properties) {
            const validation = [z.coerce.number(), z.string().min(1)].map((validator) => (validator.safeParse(properties))).filter((result) => (result.success));
            
            if (!(validation.length)) {
                throw new (require(`common-errors`).ArgumentNullError)(`ID`)
            };
            this?._id = validation[0].data; // Set to the first correct data
        };
    };

    /**
     * The authentication key (internal storage)
     * @protected
     * @type {AuthKey}
     */
    __key; 

    /**
     * The authentication key
     * @protected
     * @type {AuthKey}
     */
    get _key() {
        return this.__key;
    }
    /**
     * @param {String} value user password or existing hash
     */
    set _key(value) {
        this.__key = (value && ((value instanceof AuthKey) ? value : (new AuthKey(value)))) || undefined;
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
     * The messages
     * @protected
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
     * @returns {Statuses.Deletion_Status} true if successfully deleted or already deleted
     * @throws {import('common-errors').AuthenticationRequiredError} when authentication fails
     */
    delete(message, key) {
        let found = this.find(message);
        return (found && (() => {
            found?._key && (found._key.input = key);

            if (found instanceof DeletedMessage) {
                return new Statuses.Deletion_Status(true); // it’s already deleted
            };

            for (let index = 0; index < this.#messages.length; index++) { // Replace the instance on the list
                if (found == this.#messages[index]) {
                    this.#messages[index] = new DeletedMessage(this.#messages[index]);
                    return new Statuses.Deletion_Status(true); // finally deleted
                };
            };
        })());
    };

    /**
     * Search for a message. 
     * 
     * @function find
     * @param {Message|DeletedMessage|String|Number|Date} message - The message to search. If not provided, all messages will be returned as an alias of messages
     * @returns {Message|DeletedMessage} the message
     * @throws {Errors.NotFoundError_Message} when the message is not found
     */
    find(message) {
        let ID = (message instanceof Message || message instanceof DeletedMessage) ? message._id : message;
        let matching = this.#messages.filter(m => (m._id == ID || z.coerce.number().safeParse(ID).success && (m._id == z.coerce.number().parse(ID))))[0];
        if (!matching) {
            throw new Errors.NotFoundError_Message(ID);
        };
        return matching;
    };

    /**
     * Create a message.
     * 
     * @function create
     * @see Message
     * @param {Message} message - the message to append. If not, a message will be appended using all arguments. 
     * @returns {Message} the created message
     */
    create(message) {
        message = message instanceof Message ? message : new Message(...arguments);
        this.#messages.push(message);
        return (message);
    };

    /**
     * Flag a message. 
     * @param {Message|String|Number} 
     * @returns {Statuses.Reported_State} true if the thread was flagged; false if not changed
     * @throws {Errors.NotFoundError_Message} when the message isn’t found (relies on .find())
     */
    flag(message) {
        let found = this.find(message);
        return found ? (() => {
            found.flagged = new Statuses.Reported_State(true);
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
     * @returns {Statuses.Deletion_Status} true if the thread was deleted; false otherwise
     * @throws {import('common-errors').AuthenticationRequiredError} when authentication fails
     */
    delete(thread, key) {
        let found = this.find(thread);
        
        return found ? (() => {
            found._key && (found._key.input = key); // Attempt authentication; will not continue when an error occurs
            this.threads.delete(found);
            return new Statuses.Deletion_Status(!this.threads.has(found));
        }) : found;
    };

    /**
     * Flag a thread
     * 
     * @function flag
     * @param {MessageThread|String|Number} 
     * @returns {Statuses.Reported_State|undefined} true if the thread was flagged; false if not changed; undefined if not found
     */
    flag(thread) {
        let found = this.find(thread);

        return found ? (() => {
            found.flagged = new Statuses.Reported_State(true);
            return (this.find(thread)?.flagged);
        })() : found;
    };

    /**
     * Search for a message thread for the top `size` most recent threads. 
     * 
     * @function find
     * @param {MessageThread|String|Number|Date} thread - The message thread to search. If not provided, all messages will be returned as an alias of messages
     * @param {Number} [size=10] - the search size: If positive, it’ll return the most recent threads. If negative, the least recent threads will be returned. By default, the top 10 most recent threads will be returned. 
     * @returns {MessageThread|MessageThread[]} the message threads
     * @throws {Errors.NotFoundError_Thread} when the thread is not found
     */
    find(thread, size = 10) {
        let MULTI_SEARCH = (!thread); // When only the thread isn’t provided
        MULTI_SEARCH && z.number().int().parse(size); // attempt parsing if the size is provided
        
        /**
         * Perform a search for a single thread. 
         * @function single
         * @returns {MessageThread}
         */
        const single = () => {
            let ID = (thread instanceof MessageThread) ? thread._id : thread;
            let matching = Array.from(this.threads).filter(t => (t._id == ID || z.coerce.number().safeParse(ID).success && (t._id == z.coerce.number().parse(ID))))[0];
            
            if (!matching) {
                throw new Errors.NotFoundError_Thread(ID);
            };
            
            return matching;
        }

        /**
         * Find the most recent `size` threads. 
         * @returns {MessageThread[]} the sorted message threads
         */
        const multi = () => (
            Array.from(this.threads).sort(
                (size >= 0) // size determination
                    ? (first, second) => (second.bumped_on - first.bumped_on) // If positive, sort in descending order
                    : (first, second) => (first.bumped_on - second.bumped_on) // Otherwise, sort in ascending order
            ).slice(0, size)
        );
        
        return MULTI_SEARCH ? multi() : single();
    };

    /**
     * Create a thread.
     *  
     * @function create
     * @see MessageThread
     * @returns {MessageThread} the created thread
     * @throws {import('common-errors').AlreadyInUseError} when the thread ID is already used
     */
    create(properties) {
        if (((typeof properties) == "object") ? (properties && properties?._id) : properties) {
            let found = true; 
            try {
                this.find(properties)
            } catch(error) {
                if (error instanceof Errors.NotFoundError_Thread) {
                    found = false; 
                };
            }
            
            found && (
                /**
                 * If found, throw an error of the thread already being used. It can not be created. 
                 */
                () => {throw new (require(`common-errors`).AlreadyInUseError)(`thread`)})();
		};

        let thread = new MessageThread(properties);
        this.threads.add(thread);
        return (thread);
    };
};

Message.parent = MessageThread;
MessageThread.parent = MessageBoard;

module.exports = {Message, DeletedMessage, MessageThread, MessageBoard}