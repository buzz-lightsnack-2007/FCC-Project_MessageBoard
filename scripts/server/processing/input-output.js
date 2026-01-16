const Logging = require(`../../utils/logging.js`);
const Errors = [...Object.values(
		require(`../../messaging/controller.js`).Errors
	), require(`common-errors`).AuthenticationRequiredError, require(`common-errors`).ArgumentNullError, require(`common-errors`).AlreadyInUseError, require(`zod`).ZodError];

class Formats {
	static error = require(`../formats/errors/error.js`);
	static types = require(`../formats/response/template.js`);
}
const ErrorProcessor = require(`./errors.js`);

class OutputProcessor {
	/**
	 * Current content held by the processor.
	 * Can be a formatted error, a formatted single stock response, a formatted comparison response, or a raw value in other cases.
	 *
	 * @type {Boolean|String|}
	 */
	content;

	/**
	 * Execute an async callback and process its result or any thrown known errors.
	 *
	 * The first argument to this method is expected to be the callback function. Any additional arguments passed to execute(...) are forwarded to the callback.
	 * 
	 * Known errors are caught and wrapped in `Formats.error`. Unknown errors are re-thrown.
	 *
	 *
	 * @param {Function} callback - Async function to execute (should return a manager result).
	 * @param {...any} [args] - Arguments forwarded to the callback.
	 * @param {*} type - the type to coerce to (by creating a new instance of)
	 * @returns {Promise<Formats.error|Formats.response.stockData|Formats.response.comparedStockData|any>} The processed content.
	 */
	async execute(callback, type) {
		let result; 
		try {
			result = await callback(...Array.from(arguments).slice(2))
		} catch(error) {
			if (Errors.some((KnownError) => (error instanceof KnownError))) {
				Logging.Verbosity.response && (new Logging.Error(error)).show();
				this.content = (new ErrorProcessor(error)).message;
			} else {
				throw error;
			};
		};

		if (result) {
			(type && (typeof type).includes(`obj`)) && (result = new type(result)) // coerce
			this.content = (result instanceof Formats.types.ResponseData) ? result.content : result; 
		};

		return this.content;
	};

	/**
	 * Create a new `OutputProcessor`.
	 *
	 * @constructor
	 * @param {any} [output] - Optional initial content to seed the processor with.
	 */
	constructor(output) {
		output && (this.content = output);
	};
};

module.exports = OutputProcessor;