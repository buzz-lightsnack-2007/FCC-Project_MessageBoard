const InternalError = require(`../utils/messaging`).InternalError; 
const zod = require('zod');

/**
 * When authentication is required but not provided
 * @class AuthenticationRequiredError
 * @extends InternalError
 */
class AuthenticationRequiredError extends InternalError {
	name = `AuthenticationRequiredError`;

	/**
	 * The resource being accessed
	 * @type {String|Number}
	 */
	entity; 

	/**
	 * @constructor
	 * @param {String|Number} id - The resource being accessed
	 * @param {String} message - any message
	 */
	constructor(id, message) {
		super(message, 401);
		this.entity = id;
	};
};

/**
 * When authentication fails
 * @class AuthenticationError
 * @extends AuthenticationRequiredError
 */
class AuthenticationError extends AuthenticationRequiredError {
	name = `AuthenticationError`;

	/**
	 * @constructor
	 * @param {String|Number} id - The resource being accessed
	 * @param {String} message - any message
	 */
	constructor(id, message) {
		super(id, message);
	};
};

module.exports = {
	AuthenticationError,
	AuthenticationRequiredError
};