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
		 * @returns {types.Board[]|null} The found board(s) or null if not found
		 */
		find: async (query, ...args) => {
			return query;
		},

		/**
		 * Callback for updating a board
		 * @param {types.Board} board - The board to update
		 */
		update: temp
	};

	/**
	 * The last board used
	 */
	last; 

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

		if (result) {this.last = board; }; 

		return (result) ? board : result;
	};

	/**
	 * Deletes a board.
	 * @param {types.Board|String} board - The board to delete.
	 * @returns {types.Board|String|boolean} The deleted board or false if not found.
	 */
	async delete (board) {
		board = getTitle(board);

		if (!board) {return false;};
		let result = true; 

		if (this.callbacks.erase) {
			result = await this.callbacks.erase(board);
		};

		if (result) {this.last = board; }; 

		return (result) ? board : result;
	}; 

	/**
	 * Find the board, then recreate the board itself. 
	 * 
	 * @param {Object} query - The query to find the board.
	 * @param {*} [arguments] - Additional arguments for the find callback. See the find callback for details.
	 * @returns {types.Board[]} The found boards
	 */
	async find(query, ...arguments) {
		let result; 
		result = await this.callbacks.find(query, ...arguments);
		if (result && ((result instanceof Array) ? result.length : 1) > 0) {
			if (!(result instanceof Array)) {
				result = [result]; 
			}; 

			result = result.map(board => new types.Board(board)); 
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
		if (result) {
			this.last = board;
		}; 

		return result; 
	};

	/**
	 * @constructor
	 * @param {Object} [callbacks] - The callbacks for board operations.
	 */
	constructor(callbacks) {
		callbacks && Object.assign(this.callbacks, callbacks);
	};

	/**
	 * Export the board in preparation for saving to the database. 
	 * 
	 * @type {types.Board} board - The board to export
	 */
	export(board) {
		// Get IDs of its threads
		let ids = board.threads.map(thread => ((thread instanceof Object) ? thread._id : thread));

		return { ...board, "threads": ids };
	};
};

module.exports = BoardRepository;