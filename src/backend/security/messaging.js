/**
 * Security-related messaging
 * 
 * @file messaging.js
 * @module security/messaging
 */

// Imports
const errors = require('common-errors');
const zod = require('zod');

const messaging = require('../utils/messaging');

const Errors = {
	"AuthenticationError":
		class AuthenticationError extends errors.AuthenticationRequiredError {
			/**
			 * The password used
			 * @type {string}
			 */
			password;

			/**
			 * The hash of the entity being authenticated
			 * @type {import('./code').Hash}
			 */
			hash;

			/**
			 * The resource being accessed
			 * @type {String|Number}
			 */
			id;

			/**
			 * @constructor
			 * @param {String} password - The password used
			 * @param {import('./code').Hash} hash - The hash of the entity being authenticated
			 * @param {String|Number} id - The resource being accessed
			 * @param {String} message - any message
			 * @param {Error} inner_error - the Error instance that caused the current error. Stack trace will be appended. 
			 * @see {@link https://www.npmjs.com/package/common-errors#authrequired}
			 */
			constructor(password, hash, id, ...arguments) {
				super(...arguments);
				this.password = password;
				this.hash = hash;
				this.id = id;
			};
		}
}

const Messages = {
	"Success":
		/**
		 * @class AuthenticationSuccess
		 * 
		 * Indicates an authentication request was successful
		 */
		class AuthenticationSuccess extends messaging.Success {
			/**
			 * The password of the authenticated entity
			 * @type {string}
			 */
			password;

			/**
			 * The hash of the authenticated entity
			 * @type {import('./code').Hash}
			 */
			result;

			/**
			 * The resource being accessed
			 * @type {String|Number}
			 */
			id;

			/**
			 * @constructor
			 * @param {string} password - The password of the authenticated entity
			 * @param {import('./code').Hash} hash - The hash of the authenticated entity
			 * @param {Object} cause - the process that has determined a success result
			 * @param {String} description - a description of the message
			 */
			constructor(password, hash, id, cause, description = ``) {
				super(hash, cause, description);
				this.password = password;
				this.id = id; 
			};
		},
	"Failure":
		/**
		 * @class AuthenticationFailure
		 * 
		 * Indicates an authentication request was unsuccessful
		 */
		class AuthenticationFailure extends messaging.Error {
			/**
			 * The error details
			 * @type {Errors['AuthenticationError']}
			*/
			error;

			/**
			 * The password used
			 * @type {string}
			 */
			get password() { return this.error?.password; }

			/**
			 * The hash of the entity being authenticated
			 * @type {import('./code').Hash}
			 */
			get hash() { return this.error?.hash; }

			/**
			 * The resource being accessed
			 * @type {String|Number}
			 */
			get id() { return this.error?.id; }
			set id(value) { if (this.error) {this.error.id = value;}; }

			/**
			 * @constructor
			 * @param {string} password - The password used
			 * @param {import('./code').Hash} hash - The hash of the entity being authenticated
			 * @param {String|Number} id - The resource being accessed
			 * @param {Object} cause - the process that has determined a failure result
			 * @param {String} description - a description of the message
			 */
			constructor(password, hash, id, cause = undefined, description = undefined) {
				super(new Errors.AuthenticationError(password, hash, id), cause, description);
			};
		}
};

module.exports = {
	Errors,
	Messages
};