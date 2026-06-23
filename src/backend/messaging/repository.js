const zod = require(`zod`); 
const sift = require(`sift`); 
const types = {
	Board: require(`./board`), 
	...require(`./message`)
}

/**
 * Repository for managing Board instances.
 */
class BoardRepository {
	/**
	 * Creates a new Board instance.
	 * @param {Object|string} data - Board data or title.
	 * @returns {types.Board} The created board.
	 */
	create(data) {
		return new types.Board(data);
	}

	/**
	 * Updates a board's information.
	 * @param {types.Board} board - The board instance to update.
	 * @param {Object} data - The updated data.
	 * @returns {types.Board} The updated board.
	 */
	update(board, data) {
		Object.assign(board, data);
		return board;
	}

	/**
	 * Deletes a board.
	 * @param {types.Board} board - The board to delete.
	 * @param {boolean} [force=false] - If true, the board is considered fully removed.
	 * @returns {types.Board|boolean} The board with hidden=true or true if forced.
	 */
	delete(board, force = false) {
		if (force) return true;
		board.hidden = true;
		return board;
	}
}

/**
 * Base class for repositories that manage children of a parent object.
 * @abstract
 */
class BaseChildRepository {
	/**
	 * @constructor
	 * @param {Function[]|Function} childClasses - Priority list of classes for children
	 * @param {Function} parentClass - The class of the parent object
	 * @param {string} [childrenField='children'] - The property name where children are stored from the parent
	 */
	constructor(childClasses, parentClass, childrenField = 'children') {
		this.childClasses = Array.isArray(childClasses) ? childClasses : [childClasses];
		this.parentClass = parentClass;
		this.childrenField = childrenField;
	}

	/**
	 * Creates a new child and appends it to the parent.
	 * @param {Object} parent - The parent instance.
	 * @param {Object} data - Data for the new child.
	 * @returns {Object} The created child instance.
	 */
	create(parent, data) {
		let child; 
		for (child_type = 0; child_type < this.childClasses.length; child_type++) {
			try {
				child = new this.childClasses[child_type](data);
				break;
			} catch (e) {
				if (child_type === this.childClasses.length - 1) {
					throw e; 
				}; 
			}; 
		}; 
		parent[this.childrenField].push(child);
		return child;
	};

	/**
	 * Updates a child's information.
	 * @param {Object} parent - The parent instance.
	 * @param {number} id - The ID of the child to update.
	 * @param {Object} data - The updated data.
	 * @returns {Object|null} The updated child or null if not found.
	 */
	update(parent, id, data) {
		const child = parent[this.childrenField].find(c => c._id == id);
		if (!child) return null;

		Object.assign(child, data);
		return child;
	};

	/**
	 * Deletes a child from the parent.
	 * @param {Object} parent - The parent instance.
	 * @param {number} id - The ID of the child to delete.
	 * @param {boolean} [force=false] - If true, removes the child from the array.
	 * @returns {Object|null} The deleted child or null if not found.
	 */
	delete(parent, id, force = false) {
		const index = parent[this.childrenField].findIndex(c => c._id == id);
		if (index == -1) return null;

		const child = parent[this.childrenField][index];
		(force)
			? parent[this.childrenField].splice(index, 1)
			: (child.hidden = true);
		
		return child;
	};

	/**
	 * Exports a copy of the parent with children represented by their IDs.
	 * @param {Object} parent - The parent instance.
	 * @returns {Object} A plain object representation of the parent.
	 */
	export(parent) {
		// Take the list of children IDs
		let IDs = parent[this.childrenField].map(c => c._id);

		// Create a copy of the parent object
		const copy = JSON.parse(JSON.stringify(parent));
		copy[this.childrenField] = IDs; 
		return copy;
	};

	/**
	 * Imports children for a parent and returns the parent instance.
	 * @param {Object} parentData - The parent data (instance or plain object).
	 * @param {Function} callback - Async function to fetch children data.
	 * @returns {Promise<Object>} The parent instance with populated children.
	 */
	async import(parentData, callback) {
		const id = parentData._id;
		const childrenData = await callback(id);
		const childrenInstances = childrenData.map(d => {
			let child;
			for (child_type = 0; child_type < this.childClasses.length; child_type++) {
				try {
					child = new this.childClasses[child_type](data);
					break;
				} catch (e) {
					if (child_type == this.childClasses.length - 1) {
						throw e; 
					}; 
				}; 
			}; 
			return child;
		});

		let parent = (parentData instanceof this.parentClass) 
			? parentData 
			: new this.parentClass(parentData);

		parent[this.childrenField] = childrenInstances;
		return parent;
	};
}

/**
 * Repository for managing Threads within Boards.
 * @extends BaseChildRepository
 */
class ThreadRepository extends BaseChildRepository {
	constructor() {
		super(types.Thread, types.Board, 'threads');
	}
}

/**
 * Repository for managing Messages and Reactions within Threads.
 * @extends BaseChildRepository
 */
class MessageRepository extends BaseChildRepository {
	constructor() {
		super([types.Reaction, types.Message], types.Thread, 'children');
	}
}

module.exports = {
	ThreadRepository,
	MessageRepository
};


