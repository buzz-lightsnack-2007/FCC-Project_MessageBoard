/**
 * @requires zod
 * @requires sift
 * @requires ./simulated/Container
 */
const zod = require(`zod`).z; 
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
	}

	/**
	 * Initialize a data cache. 
	 * @constructor
	 * @param {*} data - the data to use
	 */
	constructor(data) {
		this.data = data; 
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
	 * Data within active caches
	 * @type {Array<*>}
	 */
	get data() {
		return Array.from(this.cache).map((data) => data.data);
	};

	/**
	 * Fetch in data
	 * 
	 * @param {Object} filter - the filter to use
	 * @param {Boolean} [replace = false] - determines if the cache should be replaced if it already exists
	 * @returns {Set<Object>} - the loaded data
	 */
	load(filter, replace = false) {
		filter = filterify(filter); 

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

		let matching = new Set(this.database.find(filter)); 
		matching.length && matching.forEach((data) => {
			let cache = new DataCache(data); 
			let insertable = deduplicate(cache); 

			if (insertable) {
				this.cache.add(cache); 
			} else {
				matching.delete(data); 
			}; 
		}); 

		return matching;
	}; 

	/**
	 * Select data.
	 * 
	 * Data will be loaded if it is not already cached.
	 * @param {Object} filter - the filter to use
	 * @returns {Array<*>} - the selected data
	 */
	select(filter) {
		filter = filterify(filter); 
		this.load(filter);

		let matching = this.data.filter(sift(filter));
		return matching;
	};

	/**
	 * Close the data, updating the database if necessary.
	 * @param {Object} filter - the filter to use
	 * @param {Boolean} [update = true] - determines if the database should be updated
	 * @returns {Array<*>} - the closed data
	 */
	close(filter, update = true) {
		filter = filterify(filter); 
		let matching = this.select(filter);

		matching.length && matching.forEach((data) => {
			if (update) {
				// Update the database with the new data
				let id = data._id;
				this.database.update({ _id: id }, data); 
			}; 

			this.cache.forEach((cache) => 
				((data == cache.data) && this.cache.delete(cache))
			); 
		}); 

		return matching;
	}; 

	/**
	 * Delete the data. 
	 * 
	 * Data will be removed from the cache and the database, but will be returned here. 
	 * @param {Object} filter - the filter to use
	 */
	pop(filter) {
		filter = filterify(filter);

		let matching = this.select(filter);
		matching.length && matching.forEach((data) => {
			// Delete the data from the database
			let id = data._id;
			this.database.delete({ _id: id });

			// Delete the data from the cache
			this.cache.forEach((cache) => 
				((data == cache.data) && this.cache.delete(cache))
			);  
		}); 

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