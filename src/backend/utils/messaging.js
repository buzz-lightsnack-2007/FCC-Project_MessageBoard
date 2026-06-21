/**
 * @file messaging.js
 * @module utils/messaging
 * Internal messaging utilities for the back-end, where detailed information can be logged
 */
const zod = require(`zod`);

/**
 * A message
 * @class Message
 */
class Message {
	/**
	 * The date the message was created
	 * @type {Date}
	 */
	date;

	/**
	 * The sender of this message
	 * @type {Object|String}
	 */
	cause;

	/**
	 * Description
	 * @type {String}
	 */
	description;

	/**
	 * @constructor
	 * Creates a message. 
	 * 
	 * @param {Object} cause - the sender of the message; may be the instance of an object or a string. If not, the stack trace will be used to determine the sender.
	 * @param {String} description - a description of the message
	 */
	constructor(cause = null, description = "") {
		/**
		 * The description of the message, if provided and valid. Otherwise, undefined.
		 */
		const string_import_schema = zod.coerce.string().min(1);

		this.date = new Date();
		this.description = ([undefined, null].includes(description) || !(string_import_schema.safeParse(description).success)) ? undefined : string_import_schema.safeParse(description).data;

		if (cause) {
			this.cause = cause;
		} else {
			// If no cause is provided, use the stack trace to determine the sender
			const stack = new Error().stack;
			const lines = stack?.split?.("\n");

			// The third line in the stack trace is usually the caller of this constructor
			this.cause = (lines?.length || 0) >= 3 ? lines[2].trim() : undefined;
		};
	};
};

const types = {
	"Success":
		/**
		 * A success message, indicating a successful operation
		 * @class SuccessMessage
		 * @extends Message
		 */
		class SuccessMessage extends Message {
			/**
			 * The result of that operation
			 */
			result;

			/**
			 * @constructor
			 * Creates a success message.
			 * @param {*} result - the result of that operation
			 * @param {Object} cause - the process that has determined a success result
			 * @param {String} description - a description of the message
			 */
			constructor(result, ...arguments) {
				super(...arguments);
				this.result = result;
			};
		},
	"Warning":
		/**
		 * A warning message, indicating a potentially problematic operation that may require attention
		 * @class WarningMessage
		 * @extends Message
		 */
		class WarningMessage extends Message {
			/**
			 * The warning details
			 * @type {*}
			 */
			warning;

			/**
			 * A result, if applicable
			 * @type {*}
			 */
			result;

			/**
			 * @constructor
			 * Creates a warning message.
			 * @param {*} warning - the details of the warning
			 * @param {*} result - the result of that operation, if applicable
			 * @param {Object} cause - the process that has determined a warning result
			 * @param {String} description - a description of the message
			 */
			constructor(warning, result = null, ...arguments) {
				super(...arguments);
				this.warning = warning;
				this.result = result;
			};
		},
	"Error":
		/**
		 * An error message, indicating a failed operation that may require attention
		 * @class ErrorMessage
		 * @extends Message
		 */
		class ErrorMessage extends Message {
			/**
			 * The error details
			 * @type {*}
			 */
			error;

			/**
			 * @constructor
			 * Creates an error message.
			 * @param {*} error - the details of the error
			 * @param {Object} cause - the process that has determined an error result
			 * @param {String} description - a description of the message
			 */
			constructor(error, cause = null, description = "") {
				super(cause || ((error instanceof Error && !cause) ? error.stack : undefined), description);
				this.error = error;
			};
		}
};

/**
 * Checks the category of a message
 * @param {Message} message - the message to check
 * @returns {"success"|"warning"|"error"|undefined} the category of the message, or undefined if it does not match any category
 */
Message.getCategory = (message) => {
	let match = Object.entries(types).filter(([_, type]) => message instanceof type);
	return match.length ? match[0][0]?.toLowerCase() : undefined;
};

module.exports = {
	Message,
	getCategory: Message.getCategory,
	...types
};