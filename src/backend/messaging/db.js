/**
 * @file db.js
 * Integrates the repositories with the database
 * @module backend/messaging/db
 */

/**
 * @requires ../database/controller.js
 * @requires ../database/simulated/registry.js
 * @requires ./message/repository.js
 * @requires ./thread/repository.js
 */

const DataController = require('../database/controller.js');
const db = require(`../database/simulated/registry.js`).Register; 
const repositories = {
	...require(`./message/repository`),
	BoardRepository: require(`./board/repository`),
};

/**
 * Find the hierarchy of parents. 
 * 
 * @param {*} parents 
 */
const process_parents = (parents) => {

}

class MessagesManager extends DataController {
	constructor() {
		super(db.comments); 
	}; 
};

class BoardsManager extends DataController {
	/**
	 * Ensures that a correct filter is in the correct format
	 * 
	 * `filterify` converts any input string or number into a filter searching for the name. 
	 * 
	 * @param {Object|String|Number|String[]|Number[]} filter - the filter to use
	 */
	filterify(filter) {
		if (typeof filter == `object` && !Array.isArray(filter)) {
			return filter; 
		};

		filter = zod.array(zod.union([zod.string(), zod.number()])).parse(
			Array.isArray(filter) ? filter : [filter]);
		
		return { "title": { $in: filter } };
	};

	constructor() {
		super(db.users); 
	};
};

class MessagingManager {
	/**
	 * Controllers
	 */
	#controllers = {
		"messages": new MessagesManager(),
		"boards": new BoardsManager()
	};

	/**
	 * The repositories
	 */
	#repositories = {
		"boards": new repositories.BoardRepository(),
		"threads": new repositories.ThreadRepository(),
		"messages": new repositories.MessageRepository()
	}; 

	/**
	 * @constructor
	 */
	constructor() {};

	/**
	 * Find a board, a thread, or a message by its ID. 
	 * 
	 * @async
	 * @param {String[]|Number[]} parents - the parents of the object to find, in descending hierarchy (board, thread, message)
	 */
	async find(parents) {
		
	};

}

module.exports = {
	MessagingManager,
	BoardsManager,
	MessagesManager
}