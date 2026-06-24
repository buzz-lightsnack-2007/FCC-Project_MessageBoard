/**
 * @file db.js
 * Integrates the repositories with the database
 * @module backend/messaging/db
 */

/**
 * @requires zod
 * @requires ../database/controller.js
 * @requires ../database/simulated/registry.js
 * @requires ./message/repository.js
 * @requires ./thread/repository.js
 */
const z = require(`zod`).z;
const DataController = require('../database/controller.js').DataController;
const db = require(`../database/simulated/registry.js`).Register; 
const repositories = {
	...require(`./message/repository`),
	BoardRepository: require(`./board/repository`),
};
const errors = require(`../database/messaging`);
const Board = require(`./board/board`); 

/**
 * Find the hierarchy of parents. 
 * 
 * @param {String[]|Number[]|String} parents 
 * @returns {String[]|Number[]} - the parents in descending hierarchy (board, thread, message)
 */
const process_parents = (parents) => {
	parents = (parents instanceof Set) ? Array.from(parents) : parents; 

	if (Array.isArray(parents)) {
		return z.array(z.union([z.string(), z.number()])).parse(parents);
	} else if (!parents) {
		return null; 
	}; 
	
	return parents.split(`,`); 
}; 

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

		filter = z.array(z.union([z.string(), z.number()])).parse(
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
	constructor() {
		let board_methods = {
			"create": this.#controllers.boards.insert.bind(this.#controllers.boards),
			"erase": this.#controllers.boards.pop.bind(this.#controllers.boards),
			"find": async (ID) => {
				let board = await this.#controllers.boards.select(ID, false, true, false)?.[0];
			},
			"update": (board) => {
				// Replace any item with the same ID in the cache with the updated board
				for (const cache of this.#controllers.boards.cache) {
					if (cache.id == board._id) {
						cache.data = this.#repositories.boards.export(board);
						break; 
					}; 
				}; 
				return this.#controllers.boards.close(board);
			}
		};

		this.#repositories.boards.callbacks = board_methods;
	};

	/**
	 * Find a board, a thread, or a message by its ID. 
	 * 
	 * @async
	 * @param {String[]|Number[]} parents - the parents of the object to find, in descending hierarchy (board, thread, message)
	 */
	async find(parents) {
		parents = process_parents(parents);
		
		if (parents.length) {
			let match = {}; 

			let levels = [
				/**
				 * Finds the board. 
				 * @param {String|Number} parent - the board ID
				 */
				async (parent) => {
					let board = await this.#repositories.boards.find(parent, true, true)?.[0];

					return board; 
				},
				/**
				 * Finds the thread. 
				 * @param {String|Number} parent - the thread ID
				 * @param {Board} prev - the board found in the previous step
				 */
				async (parent, prev) => {
					/**
					 * @type {Board}
					 */
					let board = await this.#repositories.threads.import(prev, async (id) => {
						return await this.#controllers.messages.select(parent)?.[0];
					});
					
					let found = false; 
					for (let thread_count = 0; thread_count < board.threads.length; thread_count++) {
						if (board.threads[])
					}
				},
				/**
				 * Finds the message.
				 */
				async (parent, prev) => {

				}
			]

			let board; 
			let thread; 
			let message; 
		}
	};

}

module.exports = {
	MessagingManager,
	BoardsManager,
	MessagesManager
}