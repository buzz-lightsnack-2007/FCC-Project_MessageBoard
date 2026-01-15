const Errors = require(`common-errors`);
const Logging = require(`../utils/logging.js`);
const VERBOSE_CONNECTION = require(`../utils/logging.js`).Verbosity.connection;

/**
 * An active connection
 * @param {import("express").Request} request - The Express request object.
 * @param {import("express").Response} response - The Express response object.
 */
class Connection {
	/**
	 * The client’s request
	 * @type {import("express").Request}
	 */
	request; 

	/**
	 * The server’s response
	 * @type {import("express").Response}
	 */
	response;

	/**
	 * Start time
	 * @type {Date}
	 * @private
	 */
	#start;
	
	/**
	 * Start time
	 * @type {Date}
	 */
	get start() {return (this.#start);};
	set start(value) {this.#start = new Date(value);};

	/**
	 * @constructor
	 * @param {import("express").Request} request - The Express request object.
	 * @param {import("express").Response} response - The Express response object.
	 * @param {Boolean} verbosity - controls whether to log the incoming request or the instantiation
	 */
	constructor(request, response, verbosity) {
		/**
		 * Verbose logging
		 * @function log
		 * @returns {String|Boolean} The displayed message, or anything else if disabled
		 */
		const log = () => (
			// Verbose logging
			((typeof(verbosity) == `boolean`)
				? verbosity
				: VERBOSE_CONNECTION) && 
			(new Logging.Log(`\x1b[1m${this.request.ip}\x1b[0m@${this.start.getTime()} ${this.request.method}: \x1b[4m\x1b[38;2;0;0;255m${this.request.path}\x1b[0m${(request?.query && Object.entries(request.query).length && ` ${JSON.stringify(request.query)}`) || ``}`)).show()
		);

		this.start = new Date();
		if (request instanceof Connection) {
			Object.assign(this, request);
		} else if (request && response) {
			this.request = request;
			this.response = response;
			log();
		};
	};
};

/**
 * The response
 */
class Response {
	/**
	 * Additional headers
	 * @type {Object.<string, string>}
	 */
	headers = {};

	/**
	 * Status code
	 * @type {Number}
	 */
	status;

	/**
	 * Body content
	 * @type {any}
	 */
	body;

	/**
	 * Redirect URL
	 * @type {URL|string}
	 */
	redirect;

	/**
	 * @constructor
	 * @param {Response} properties - the properties
	 */
	constructor(properties) {
		(properties instanceof Response) && Object.assign(this, properties);
	};

	/**
	 * Execute the response
	 * @param {Connection} response - The connection
	 */
	execute(response) {
		response.response.statusCode = this.status;
		Object.keys(this.headers).length && Object.entries(this.headers).forEach((header) => {
			response.response.setHeader(header[0], header[1]);
		});

		let result; 
		if (this.redirect) {
			result = response.response.redirect(this.redirect);
		} else {
			result = response.response.send(this.body);
		};

		VERBOSE_CONNECTION && (new Logging.Log(`\x1b[1m${response.request.ip}\x1b[0m@${response.start.getTime()} request handled: ${this.status} ${this.redirect ? `(redirect to \x1b[4m\x1b[38;2;0;0;255m${this.redirect}\x1b[0m)` : ``}`)).show(); // Log the response
		
		return result;
	};
};

/**
 * Manages connections
 * @class ConnectionManager
 */
class ConnectionManager {
	/**
	 * Active connections
	 * @type {Set<Connection>}
	 */
	connections = new Set();

	/**
	 * @constructor
	 * @param {ConnectionManager} [properties] - the properties to copy
	 */
	constructor(properties) {
		(properties instanceof ConnectionManager) && Object.assign(this, properties);
	};

	/**
	 * Callbacks
	 * @type {Object.<string, Function>}
	 */
	callbacks = {};

	/**
	 * Add a connection. 
	 * @method add
	 * @async
	 * @param {import("express").Request} request - The Express request object.
	 * @param {import("express").Response} response - The Express response object.
	 * @returns {Connection} the created connection
	 */
	async add() {
		let connection = new Connection(...arguments);

		// If no connections existed before, call the initialisation callback
		this.connections.size <= 0 && await this?.callbacks?.init?.();

		this.connections.add(connection); await this.callbacks?.add?.(connection);
		return (connection);
	};

	/**
	 * Find a connection by request object
	 * @method find
	 * @param {import("express").Request|Date} request - The Express request object, or the start time to search for
	 * @returns {Connection} the found connection
	 * @throws {Errors.NotFoundError} when the connection is not found
	 */
	find(request) {
		let result = Array.from(this.connections).filter(c => ([c.request, c.start].includes(request)))[0];
		if (!result) {
			throw new Errors.NotFoundError(request);
		};
		return result;
	};

	/**
	 * On empty
	 * 
	 * @private
	 * @method onEmpty
	 */
	#onEmpty() {
		VERBOSE_CONNECTION && (new Logging.Log(`No active connections remain.`)).show();
		return this?.callbacks?.empty?.(...arguments)
	};

	/**
	 * Send a response and remove the connection
	 * @method respond
	 * @async
	 * @param {import("express").Request|Date} request - The Express request object, or the start time to search for
	 * @param {Response} response - The response to send
	 * @returns {Connection} the connection that was responded to
	 */
	async respond(request, response) {
		let found = this.find(request);
		response.execute(found);

		// Remove the connection
		this.connections.delete(found);
		await this.callbacks?.remove?.(found);

		// If no connections remain, call the empty callback
		this.connections.size <= 0 && await this.#onEmpty();

		return (found);
	};
}

module.exports = {Connection, Response, ConnectionManager};