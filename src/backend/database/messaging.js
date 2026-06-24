/**
 * Messaging regarding the database
 * @file messaging.js
 * @module database/messaging
 */

const errors = require(`../utils/messaging`)

/**
 * When a filter yields no results
 * @class NotFoundError
 * @extends InternalError
 */
class NotFoundError extends errors.InternalError {
	/**
	 * The search query
	 * @type {Object}
	 */
	filter; 

	/**
	 * @constructor
	 * 
	 * Constructs a new `NotFoundError` instance. 
	 * 
	 * @param {Object} filter - the search query
	 * @param {String} message - any message
	 */
	constructor(filter, message) {
		super(message, 404);
		this.filter = filter;
	}; 
}; 

/**
 * When an entity is not found
 * @class EntityNotFoundError
 * @extends NotFoundError
 */
class EntityNotFoundError extends NotFoundError {
	/**
	 * The ID of the entity being searched for
	 * @type {String|Number}
	 */
	filter;

	/**
	 * @constructor
	 * 
	 * Constructs a new `EntityNotFoundError` instance.
	 * 
	 * @param {String|Number} ID - the ID of the entity being searched for
	 * @param {String} message - any message
	 */
	constructor(ID, message) {
		super(ID, message);
		this.filter = ID;
	}; 
}; 

module.exports = {NotFoundError, EntityNotFoundError};