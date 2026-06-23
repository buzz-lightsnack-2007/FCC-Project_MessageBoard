/**
 * @file board.js
 * Board model for the message board application
 *
 * @module Board
 */
const zod = require("zod");

const types = require(`../message`);

/**
 * A message board
 * @class Board
 */
class Board {
	/**
	 * board ID
	 * @type {number}
	 */
	_id;

	/**
	 * User roles
	 * @type {array}
	 */
	roles = [];

	/**
	 * The board's title
	 * @type {string}
	 */
	title;

	/**
	 * The board's description
	 * @type {string}
	 */
	description;

	/**
	 * The threads on the board
	 * @type {array}
	 * @private
	 */
	#threads = [];

	/**
	 * The threads on the board
	 * @type {array}
	 */
	get threads() {
		return this.#threads;
	};
	set threads(threads) {
		this.threads = threads ? zod.array(types.Thread).parse(threads) : [];
	};

	/**
	 * Creates or copies the board's data
	 * 
	 * @constructor
	 * @param {Board|String} content - the board to copy from or a string to name the board
	 * @param {String} content.title - the title of the board
	 * @param {String} content.description - the description of the board
	 * @param {Array} content.threads - the threads on the board
	 * @param {Array} content.roles - the roles on the board
	 * @returns {Board} The copied board
	 */
	constructor(content) {
		if (content instanceof Object) {
			/**
			 * Determines whether to copy fields
			 */
			let copy = {
				"_id": content?._id && zod.coerce.number().safeParse(content?._id),
				"title": content?.title && zod.coerce.string().safeParse(content.title),
				"description": content?.description && zod.coerce.string().safeParse(content.description),
				"children": content?.threads && zod.array(types.Thread).safeParse(content.threads),
				"roles": content?.roles && zod.array(zod.any()).safeParse(content.roles)
			};

			this._id = copy._id?.success ? copy._id.data : undefined;
			this.title = copy.title?.success ? copy.title.data : undefined;
			this.description = copy.description?.success ? copy.description.data : undefined;
			this.threads = copy.children?.success ? copy.children.data : [];
			this.roles = copy.roles?.success ? copy.roles.data : [];
		} else if (typeof content == "string") {
			this.title = content;
		};
	};
};

module.exports = Board;
