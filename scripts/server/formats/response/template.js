/**
 * @template
 * @class ObjectResponseData
 */
class ObjectResponseData {
	/**
	 * Import and populate this instance from a payload. 
	 *
	 * @abstract
	 * @param {*} data - The data to import
	 * @returns {stockData} The current instance after importing data (for chaining).
	 * @throws {Error} If the provided data is not valid
	 */
	_import(data) {}

	/**
	 * @constructor
	 * @param {*} data - The data to import
	 */
	constructor(data) {
		data && this._import(...arguments);
	};
};

/**
 * @template
 * @class ResponseData
 */
class ResponseData extends ObjectResponseData {
	/**
	 * The response content
	 * 
	 * @abstract
	 */
	get content() {}
	
	/**
	 * @constructor
	 * @param {*} data - The data to import
	 */
	constructor(data) {
		super(...arguments);
	};
};

module.exports = {ObjectResponseData, ResponseData};