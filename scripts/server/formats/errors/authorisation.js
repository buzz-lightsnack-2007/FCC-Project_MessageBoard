/**
 * @file authorisation.js
 * @description Defines authorisation error formats sent to clients
 */

const z = require(`zod`).z;
const Formats = require(`../response/template.js`);

/**
 * Authorisation error response format
 * @class AuthorisationError
 * @extends Formats.ResponseData
 * @property {Error} error - The underlying error data
 */
class AuthorisationError extends Formats.ResponseData {
	/**
	 * Create an AuthorisationError response format.
	 * @constructor
	 * @param {Error} error - The underlying error data.
	 * @throws {z.ZodError} If the provided error data is not an error
	 */
	constructor(error) {
		super(...arguments);
	};

	/**
	 * @param {Error} error - The error to import data from.
	 * @throws {z.ZodError} If the provided error data is not an error
	 */
	_import(error) {
		this.error = (error && z.instanceof(Error).parse(error)) || undefined;
	};

	/**
	 * @type {String|undefined}
	 */
	get content() {
		return (this.error) ? `incorrect password` : undefined;
	}
}

module.exports = AuthorisationError;