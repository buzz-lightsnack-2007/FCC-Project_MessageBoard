/**
 * @requires ./board
 * @requires ../message/message
 * @requires zod
 */
const zod = require(`zod`).z; 
const types = {
	"Board": require(`./board`), 
	...require(`../message/message`)
}; 
const OtherRepositories = require(`../message/repository`); 

/**
 * A temporary function for handling board operations.
 * @async
 * @param {types.Board} board - The board to process.
 * @returns {Promise<types.Board>} The processed board.
 */
const temp = async (board) => {
	return board; 
}

/**
 * Get the title of the board. 
 * @param {String|types.Board} board - The board or its title.
 * @returns {String} The title of the board.
 */
const getTitle = (board) => {
	if (board instanceof types.Board) {
		return board.title; 
	} else if (board) {
		return zod.coerce.string().trim().parse(board);
	} else {
		return null; 
	};
}; 

/**
 * Repository for managing Board instances.
 * @class BoardRepository
 */
class BoardRepository {
	/**
	 * The callbacks
	 */
	callbacks = {
		/**
		 * Callback for creating a new board.
		 * @param {Object} data - The data for the new board.
		 * @returns {types.Board}
		 */
		create: temp,
		
		/**
		 * Callback when erasing a board. 
		 * @param {types.Board} board - The board to erase
		 */
		erase: temp, 

		/**
		 * Callback to find a board
		 * @param {Object} query - The query to find the board
		 */
		find: async (query) => {
			return query;
		},

		/**
		 * Callback for updating a board
		 * @param {types.Board} board - The board to update
		 */
		update: temp
	};

	/**
	 * Creates a new Board instance.
	 * @async
	 * @param {Object|string} data - Board data or title.
	 * @returns {Promise<types.Board>} The created board.
	 */
	async create (data) {
		let board = new types.Board(data); let result = board;
		if (this.callbacks.create) {
			result = await this.callbacks.create(board);
		};

		return (result) ? board : result;
	};

	/**
	 * Deletes a board.
	 * @param {types.Board|String} board - The board to delete.
	 * @param {boolean} [force=false] - If true, the board is considered fully removed.
	 * @returns {types.Board|String|boolean} The deleted board or false if not found.
	 */
	async delete (board) {
		board = getTitle(board);

		if (!board) {return false;};
		let result = true; 

		if (this.callbacks.erase) {
			result = await this.callbacks.erase(board);
		};

		return (result) ? board : result;
	}; 

	/**
	 * Find the board, then recreate the board itself. 
	 * 
	 * @param {Object} query - The query to find the board.
	 * @param {string} method - The method of `ThreadRepository` to use in conjunction with this method. 
	 * @returns {types.Board|Function} The found board. If a method is provided, a function that takes the method's remaining parameters is returned instead.
	 */
	async find(query, method) {
		let result = query; 
		result = await this.callbacks.find(query);
		if (result && !(result instanceof types.Board)) {
			result = new types.Board(result);
		}; 
		
		if (result && method && zod.string().safeParse(method).success) {
			return async (...args) => {
				let threadRepo = new OtherRepositories.ThreadRepository();
				return await threadRepo[method](result, ...args);
			};
		};

		return result;
	};

	/**
	 * Updates a board's information.
	 * @param {types.Board} board - The board instance to update.
	 * @param {Object} data - The updated data.
	 * @returns {types.Board} The updated board.
	 */
	async update(board) {
		let id = getTitle(board);
		if (!id) {return false;}

		let result = await this.callbacks.update(board);
		return result; 
	};

	/**
	 * @constructor
	 * @param {Object} [callbacks] - The callbacks for board operations.
	 */
	constructor(callbacks) {
		callbacks && Object.assign(this.callbacks, callbacks);
	};
};

module.exports = BoardRepository;