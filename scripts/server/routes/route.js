const Connection = require(`../controller.js`).Connection;

/**
 * A route
 * @class Route
 */
class Route {
	/**
	 * Response flow
	 * @abstract
	 * @param {Connection} conn - the connection instance 
	 * @returns {*} the result of the response
	 */
	static respond(conn) {}

	/**
	 * Default response type
	 */
	static type; 

	/**
	 * @constructor
	 * @param {Route} properties - the properties
	 */
	constructor(properties) {
		if (properties && (typeof properties) == `object`) {Object.assign(this, properties);}; // Merge properties
	}
}

module.exports = Route;