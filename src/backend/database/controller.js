/**
 * @requires zod
 * @requires sift
 * @requires common-errors
 * @requires ./simulated/Container
 */
const zod = require(`zod`).z; 
const errors = require(`./messaging`).Errors;
const sift = require(`sift`); 
const Container = require(`./simulated/container`); 

class DataCache {
	/**
	 * The data
	 * @type {*}
	 */
	data; 

	/**
	 * ID of the data
	 * @type {String|Number}
	 */
	get id() {
		return this.data?._id; 
	};

	/**
	 * Operations on the data
	 * @type {Number}
	 */
	operations; 

	/**
	 * Initialize a data cache. 
	 * @constructor
	 * @param {*} data - the data to use
	 * @param {Number} [operations = 0] - the number of operations on the data
	 */
	constructor(data, operations = 0) {
		this.data = data; 
		this.operations = operations; 
	}; 
}; 

/**
 * Ensures that a filter is in the correct format. 
 * 
 * If it is an ID, it will be converted to an object with the ID as the value of the _id key.
 * 
 * @param {Object|String|Number|String[]|Number[]} filter - the filter to use
 * @returns {Object} - the filter
 */
function filterify(filter) {
	if (typeof filter == `object` && !Array.isArray(filter)) {
		return filter; 
	}; 

	filter = zod.array(zod.union([zod.string(), zod.number()])).parse(
		Array.isArray(filter) ? filter : [filter]);
	return { _id: { $in: filter } };
};

class DataController {
	/**
	 * The database
	 * @type {Container}
	 */
	database;

	/**
	 * Active caches
	 * @type {Set<DataCache>}
	 */
	cache = new Set(); 

	/**
	 * Ensures that a correct filter is in the correct format
	 * 
	 * `filterify` converts any input string or number into a filter. 
	 * @protected
	 * @param {Object|String|Number|String[]|Number[]} filter - the filter to use
	 * @returns {Object} - the filter
	 */
	filterify = filterify;

	/**
	 * Data within active caches
	 * @type {Array<*>}
	 */
	get data() {
		return Array.from(this.cache).map((data) => data.data);
	};

	/**
	 * Fetch in data
	 * 
	 * @async
	 * @param {Object} filter - the filter to use
	 * @param {Boolean} [replace = false] - determines if the cache should be replaced if it already exists
	 * @param {Boolean} [raise = true] - determines if an error should be raised if the data wasn’t found
	 * @returns {Set<Object>} - the loaded data
	 */
	async load(filter, replace = false, raise = true) {
		filter = this.filterify(filter); 

		/**
		 * @param {DataCache} data - the data cache 
		 */
		const deduplicate = (data) => {
			let insertable = true; 
			let matching = Array.from(this.cache).filter((value) => data.id ? (data.id == value.id) : (data == value)); 
			
			if (matching.length) {
				if (replace) {
					matching.forEach((data) => {
						this.cache.delete(data); 
					}); 
				} else {
					insertable = replace; 
				}; 
			};

			return insertable; 
		}; 

		let matching = new Set(await this.database.find(filter)); 
		matching.length && matching.forEach((data) => {
			let cache = new DataCache(data); 
			let insertable = deduplicate(cache); 

			if (insertable) {
				this.cache.add(cache); 
			};
		}); 

		if (!matching.size && raise) {
			throw new errors.NotFoundError(JSON.stringify(filter));
		}; 

		return matching;
	}; 

	/**
	 * Select data.
	 * 
	 * Data will be loaded if it is not already cached.
	 * @async
	 * @param {Object} filter - the filter to use
	 * @param {Boolean} [use=true] - determines if it should count as an operation on the data
	 * @returns {Array<*>} - the selected data
	 */
	async select(filter, use = true) {
		filter = this.filterify(filter); 
		await this.load(filter);

		let matching = this.data.filter(sift(filter));
		if (use) {
			matching.forEach((data) => {
				let cache = Array.from(this.cache).find((c) => c.data == data);
				cache && cache.operations++;
			});
		};
		return matching;
	};

	/**
	 * Close the data, updating the database if necessary.
	 * @param {Object} filter - the filter to use
	 * @param {Boolean} [update = true] - determines if the database should be updated
	 * @param {Boolean} [force = false] - determines if the data should be closed even if it has operations
	 * @returns {Array<*>} - the closed data
	 */
	async close(filter, update = true, force = false) {
		filter = this.filterify(filter); 
		let matching = await this.select(filter);

		if (matching.length) {
			for (const data of matching) {
				if (update) {
					// Update the database with the new data
					let id = data._id;
					await this.database.update({ _id: id }, data); 
				}; 
		
				this.cache.forEach((cache) => {
					if (data == cache.data) {
						cache.operations--; 
						if (cache.operations <= 0 || force) {
							this.cache.delete(cache); 
						}; 
					}
				}); 
			};
		};

		return matching;
	}; 

	get insert() {
		return this.database.insert.bind(this.database); 
	}

	/**
	 * Delete the data. 
	 * 
	 * Data will be removed from the cache and the database, but will be returned here. 
	 * @async
	 * @param {Object} filter - the filter to use
	 */
	async pop(filter) {
		filter = this.filterify(filter);

		let matching = await this.select(filter);
		if (matching.length) {
			for (const data of matching) {
				// Delete the data from the database
				let id = data._id;
				await this.database.delete({ _id: id });

				// Delete the data from the cache
				this.cache.forEach((cache) => 
					((data == cache.data) && this.cache.delete(cache))
				);  
			};
		}; 

		return matching;
	};

	/**
	 * @constructor
	 * @param {Container} database - the database to use
	 */
	constructor(database) {
		this.database = database; 
	};
};

module.exports = {
	DataCache,
	DataController,
};