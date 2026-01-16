const MessagingTypes = require(`./messages.js`);
const MessagingErrors = require(`./errors.js`);
const MessagingStatuses = require(`./status.js`);

/**
 * @class MessagingController
 * Messaging controller
 *
 * Controls messaging functionalities
 */
class MessagingController {
	/**
	 * The message boards
	 * @type {Set<MessagingTypes.MessageBoard>}
	 */
	boards = new Set();

	/**
	 * @constructor
	 * @param {MessagingController} properties - The existing MessagingController to copy from
	 */
	constructor(properties) {
		(properties instanceof MessagingController) && Object.assign(this, properties);
	};

	/**
	 * Add a message board.
	 *
	 * @method create
	 * @see MessagingTypes.MessageBoard
	 * @returns {MessagingTypes.MessageBoard} The created messaging board
	 */
	create() {
		let board = new MessagingTypes.MessageBoard(...arguments);
		this.boards.add(board);
		return board;
	};

	/**
	 * Find a message board
	 *
	 * @method find
	 * @param {MessagingTypes.MessageBoard|String|Number} board - The message board (or its ID) to find
	 * @returns {MessagingTypes.MessageBoard} The found message board; undefined if not found
	 * @throws {Errors.NotFoundError_Board} when the board is not found
	 */
	find(board) {
		let ID = (board instanceof MessagingTypes.MessageBoard) ? board.id : board;
		let matching = Array.from(this.boards).filter(b => (b._id == ID))[0];
		if (!matching) {
			throw new Errors.NotFoundError_Board(ID);
		};
		return matching;
	};

	/**
	 * Delete a message board
	 *
	 * @method delete
	 * @param {MessagingTypes.MessageBoard|String|Number} board - The message board (or its ID) to delete
	 * @returns {MessagingStatuses.Deletion_Status} true if deleted; false if not
	 */
	delete(board) {
		let found = this.find(board);
		((typeof this?.callbacks?.deletion?.before) == "function") && this.callbacks.deletion.before(this, found);

		let deletion = (() => {
			this.boards.delete(found);
			return new MessagingStatuses.Deletion_Status(!this.boards.has(found)); // update the deletion status
		})();

		((typeof this?.callbacks?.deletion?.after) == "function") && this.callbacks.deletion.after(found, deletion);
		return deletion;
	};

	/**
	 * Callbacks
	 * @type {Object<String, Function|Object<String, Function>>}
	 */
	callbacks = {};

	/**
	 * Load the boards, optionally with an ID. If the boards are already loaded, this method will do nothing.
	 *
	 * This method will fetch data from a callback if provided.
	 * @async
	 * @method load
	 * @param {Set<Number|String>|String[]|Number[]} ID - the board IDs to selectively load
	 * @return {Promise<void|*>} resolves when loading is complete; if loading via callback, resolves with the result of the loading callback.
	 */
	load(ID) {
		return ((Array.isArray(ID) || [`string`, `number`].includes(typeof ID) || ID instanceof Set) ? async () => {
			let IDs = new Set((Array.isArray(ID) || ID instanceof Set) ? ID : [ID]);

			if (typeof this?.callbacks?.loading == "function") {
				let boards = await this.callbacks.loading(IDs);
				if (Array.isArray(boards) || boards instanceof Set) {
					boards.forEach(b => this.boards.add(b));
				};
				return boards;
			};
		} : async () => {
			// Test if already loaded
			if (this.boards.size > 0) {
				return;
			};

			// Load via callback
			if (typeof this?.callbacks?.loading == "function") {
				let boards = await this.callbacks.loading();
				if (Array.isArray(boards) || boards instanceof Set) {
					boards.forEach(b => this.boards.add(b));
				};
				return boards;
			};
		})();
	};

	/**
	 * Unload the boards.
	 *
	 * This method may only be executed with a callback, typically to save data before unloading.
	 *
	 * @method unload
	 * @async
	 * @return {Promise<*>} resolves with the result of the unloading callback
	 */
	async unload() {
		let result;
		if (typeof this?.callbacks?.unloading == "function") {
			result = await this.callbacks.unloading(this);
			this.boards.clear();
		};

		return result;
	};
};
MessagingController.Errors = MessagingErrors;

module.exports = MessagingController;
