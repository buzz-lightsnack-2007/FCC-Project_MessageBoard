/**
 * @file errors.js
 * @description Error processing for server responses.
 */

class Formats {
	static error = require(`../formats/errors/error.js`);
	static types = require(`../formats/response/template.js`);
}

class Output_Errors {
	static Generic = require(`../formats/errors/error.js`);
	static Authorization = require(`../formats/errors/authorisation.js`);
}

/**
 * Determine the appropriate output format for error responses. 
 * @class ErrorProcessor
 */
class ErrorProcessor {
	/**
	 * Current error content held by the processor.
	 * @type {Error}
	 */
	content;

	/**
	 * The processed error message content
	 * @type {Formats.error|String|any}
	 */
	get message() {
		let content = new this.type(this.content);
		if (content instanceof Formats.types.ResponseData) {
			content = content.content;
		};

		return content;
	};

	/**
	 * The determined matching error type
	 * @type {Class}
	 */
	get type() {
		const mapping = Object.fromEntries([
			[require(`common-errors`).AuthenticationRequiredError, Output_Errors.Authorization]
		])

		for (const [KnownError, OutputError] of Object.entries(mapping)) {
			if (this.content instanceof KnownError) {
				return OutputError;
			}
		};
		return Output_Errors.Generic;
	};

	/**
	 * Create a new `ErrorProcessor`.
	 *
	 * @constructor
	 * @param {Error} [error] - Optional initial error to seed the processor with.
	 */
	constructor(error) {
		error && (this.content = error);
	};
};

module.exports = ErrorProcessor;