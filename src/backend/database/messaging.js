/**
 * Messaging regarding the database
 * @file messaging.js
 * @module database/messaging
 */

/**
 * @require common-errors
 */
const errors = require(`common-errors`);

const Errors = {
	NotFoundError: errors.NotFoundError
}

module.exports = {Errors};