/**
 * @file messaging.js
 * @module utils/messaging
 * Internal messaging utilities for the back-end, where detailed information can be logged
 */

/**
 * Custom error class for internal errors
 * @class CustomError
 * @extends Error
 */
class CustomError extends Error {
	/**
	 * Error name
	 * @type {string}
	 */
	name; 

	/**
	 * Error code (HTTP status code)
	 * @type {number}
	 */
	code; 

	/**
	 * Description
	 * @type {string}
	 */
	message;

	/**
	 * @constructor
	 * @param {string|Error} message - The error message
	 * @param {number} [code = 500] - The HTTP status code for the error, which will be ignored if the message is another CustomError instance
	 */
	constructor(message, code = 500) {
		super(message);
		if (message instanceof Error) {
			this.name = message.name;
			this.message = message.message;
		} else {
			this.message = message;
		}; 

		this.code = (message instanceof CustomError) ? message.code : code; 
	};
}


/**
 * An internal error
 * 
 * This error is used to indicate that an expected internal error has occurred and was caught. 
 * 
 * @class InternalError
 * @extends CustomError
 */
class InternalError extends CustomError {
	/**
	 * @constructor
	 * @param {string|Error} message - The error message
	 * @param {number} [code = 500] - The HTTP status code for the error, which will be ignored if the message is another CustomError instance
	 */
	constructor(message, code = 500) {
		super(message, code);
		if (message instanceof Error) {
			this.stack = message.stack;
		};
	};
};

/**
 * External error
 * 
 * This error processes an internal error, preparing it for a user-friendly message.
 * 
 * @class ExternalError
 * @extends CustomError
 */
class ExternalError extends CustomError {
	/**
	 * @constructor
	 * @param {string|Error} message - The error message
	 * @param {number} [code = 500] - The HTTP status code for the error, which will be ignored if the message is another CustomError instance
	 */
	constructor(message, code = 500) {
		super(message, code);
	}; 
};

/**
 * Export the internal error for external use. 
 * @param {InternalError} error - The internal error to export
 * @returns {ExternalError} The exported external error
 */
InternalError.export = (error) => {
	return new ExternalError(error); 
}; 


module.exports = {InternalError, ExternalError};
