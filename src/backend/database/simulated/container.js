/**
 * @file container.js
 * A simulated database for the message board application
 * @module Database
 */
const sift = require(`sift`);

/**
 * @class Container
 * A simulated database
 * 
 * **Warning**: This is a simulated database and should not be used in production. Since it is only in-memory, any data stored here will be lost when the application is restarted. Furthermore, methods are artificially made async, but please see the documentation for each method to see if it is actually async or not.
 */
class Container {
	/**
	 * Stored data
	 * @private
	 * @type {Set}
	 */
	#data = new Set();

	/**
	 * Finds items in the database that match a query. The query is a MongoDB-like query object.
	 * @async
	 * @param {Object} query - the query to find items that match
	 * @returns {Object[]} an array of items that match the query
	 */
	async find(query) {
		return Array.from(this.#data).filter(sift(query));
	};

	/**
	 * Inserts an item into the database. 
	 * @async
	 * @param {Object[]} item - the item or items to insert
	 * @param {Function} _idGenerationAlgorithm - an optional algorithm to generate unique IDs for the items being inserted. The default algorithm is to use the current timestamp. 
	 * @returns {Object} the inserted item or items
	 */
	insert(item, _idGenerationAlgorithm = null) {
		/**
		 * Prepares the item or items to be inserted by ensuring they are in an array and generating unique IDs for them if they don't already have them. The IDs are generated using the provided algorithm or the default algorithm if none is provided.
		 * 
		 * @returns {String[]} the IDs of the items to insert
		 */
		const prepare = () => {
			if (!Array.isArray(item)) {
				item = [item];
			};

			/**
			 * The set of IDs of the items to insert
			 * @type {Set}
			 */
			let ids = [];

			// If callable, use it to generate IDs
			if (!_idGenerationAlgorithm || typeof _idGenerationAlgorithm != 'function') {
				_idGenerationAlgorithm = (i) => {
					let id = Date.now();

					// Check that the ids set doesn't already contain the generated id.
					while (ids.includes(id) && Array.from(this.#data).some(d => d?._id == id)) {
						id += 1;
					};

					return id;
				};
			};

			item = item.map(i => {
				i._id = i._id || _idGenerationAlgorithm(i);
				ids.push(i._id); return i;
			});

			return ids;
		};

		const insert = () => {
			item.forEach(i => this.#data.add(i));
		};

		/**
		 * Read back the inserted item or items from the database to ensure they were inserted correctly.
		 * @param {String[]} ids - the array of IDs of the items to read back
		 * @returns {Object} dictionary containing acknowledged count and IDs of the inserted items 
		 */
		const readback = async (ids) => {
			const readItems = await this.find({ _id: { $in: ids } });

			let result = {
				"acknowledged": readItems.length,
				"inserted": readItems.map(i => i._id)
			};
			return result;
		};

		const ids = prepare();
		insert();
		return readback(ids);
	};

	/**
	 * Internal helper to apply MongoDB-style updates to a document.
	 * @private
	 * @param {Object} doc - The document to update.
	 * @param {Object} update - The update operations.
	 */
	#updating(doc, update) {
		if (Object.keys(update).some(key => key.startsWith('$'))) {
			// Handle MongoDB-style update operators
			if (update.$set) {
				Object.assign(doc, update.$set);
			}
			if (update.$unset) {
				Object.keys(update.$unset).forEach(key => delete doc[key]);
			};
		} else {
			// Fallback to simple merge if no operators are used
			Object.assign(doc, update);
		};
	};

	/**
	 * Updates items that matches the filter. 
	 * @async
	 * @param {Object} filter - the query to find items to update
	 * @param {Object} update - the update operations to apply
	 */
	async update(filter, update) {
		const items = await this.find(filter);
		items.forEach(item => this.#updating(item, update));

		return {
			"acknowledged": items.length,
			"matched": items.length,
			"modified": items.length
		};
	};

	/**
	 * Deletes items matching the filter. 
	 * @async
	 * @param {Object} filter - the query to find items to delete
	 * @returns {Object} the result of the delete operation
	 */
	async delete(filter) {
		const items = await this.find(filter);
		items.forEach(item => this.#data.delete(item));
		return {
			"acknowledged": items.length,
			"deleted": items.length
		};
	};

	/**
	 * Counts the number of documents that match the filter.
	 * @param {Object} filter - the query to find items to count
	 * @returns {Number} the number of items that match the filter
	 */
	async count(filter) {
		return filter ? (await this.find(filter)).length : this.#data.size;
	};
};

module.exports = Container; 