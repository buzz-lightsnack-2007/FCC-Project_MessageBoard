/**
 * @requires zod
 * @requires sift
 * @requires common-errors
 * @requires ./simulated/Container
 */
const zod = require(`zod`).z; 
const errors = require(`./messaging`);
const sift = require(`sift`); 
const Container = require(`./simulated/container`); 

const Logging = require(`../utils/logging`); 

/**
 * Determines if whether to use a volatile storage (like an in-memory database) or a persistent one (like MongoDB)
 * @type {Boolean}
 * @todo move this elsewhere, such that it will also affect if Registry will be enabled
 */
const saving = (() => {
	let saving = process.env?.storage_volatileOnly; 
	saving = (saving == undefined) ? false : zod.coerce.boolean().parse(saving);
	
	/**
	 * @todo strings should be placed in a separate file, not just the ones below
	 */
	new Logging.Info(new Logging.LogDetails(...((saving) ? [`Using MongoDB connection`, `Saving enabled`] : [`Data will be deleted upon program termination.`, `Saving disabled`]))).show();

	return saving; 
})(); 

class DataCache {
	/**
	 * The `DataController` instance that called this constructor
	 * @type {DataController}
	 */
	caller;

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
	 * @param {Object} caller - the `DataController` instance that called this constructor
	 * @param {Number} [operations = 0] - the number of operations on the data
	 */
	constructor(data, caller, operations = 0) {
		this.data = data; 
		this.operations = operations; 
		this.caller = caller; 
	}; 

	/**
	 * Done with the data? 
	 * 
	 * Closes this data cache; calls `DataController.close()` on the data.
	 */
	async done() {
		await this.caller.close(this.data);
	}
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
	 * @param {Object|String|Number} query - the search query
	 * @param {Boolean} [replace = false] - determines if the cache should be replaced if it already exists
	 * @param {Boolean} [raise = true] - determines if an error should be raised if the data wasn’t found
	 * @throws {errors.NotFoundError} if data wasn’t found through a filter query
	 * @throws {errors.EntityNotFoundError} if data wasn’t found through an ID query
	 * @returns {Set<Object>} - the loaded data
	 */
	async load(query, replace = false, raise = true) {
		let filter = this.filterify(query); 

		/**
		 * @param {DataCache} data - the data cache 
		 * @returns {Boolean} - whether the data can be inserted into the cache
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
		matching.size && matching.forEach((data) => {
			let cache = new DataCache(data, this); 
			let insertable = deduplicate(cache); 

			if (insertable) {
				this.cache.add(cache); 
			};
		}); 

		if (!matching.size && raise) {
			throw new errors[
				(!(typeof query == `object`))
					? `EntityNotFoundError`
					: `NotFoundError`
			](query);
		}; 

		return matching;
	}; 

	/**
	 * Select data.
	 * 
	 * Data will be loaded if it is not already cached.
	 * @async
	 * @param {Object} filter - the filter to use
	 * @param {Boolean} [dc = true] - determines if the data cache will be returned instead of the data itself (default: `true`)
	 * @param {Boolean} [use=true] - determines if it should count as an operation on the data. (default: `true`)
	 * @param {Boolean} [raise=true] - determines if an error should be raised if the data wasn’t found. (default: `true`)
	 * @returns {Array<*>} - matching data
	 */
	async select(filter, dc = true, use = true, raise = true) {
		filter = this.filterify(filter); 
		await this.load(filter, false, raise);

		let match = this.data.filter(sift(filter));
		let matching = (dc && match?.length) ? Array.from(this.cache).filter((cache) => 
			ma
		) : match;
		if (use && match.length) {
			if (dc) {
				matching.forEach((cache) => cache.operations++);
			} else {
				this.cache.forEach((cache) => ((match.includes(cache.data)) && cache.operations++));
			};
		};
		return matching;
	};

	/**
	 * Close the data, updating the database if necessary.
	 * @param {Object} filter - the filter to use
	 * @param {Boolean} [update = true] - determines if the database should be updated (default: `true`)
	 * @param {Boolean} [force = false] - determines if the data should be closed even if it has operations (default: `false`)
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

	/**
	 * Insert data into the database and, optionally, into the cache. 
	 * 
	 * @param {*} data - document to insert
	 * @param {Boolean} [use = false] - determines if it should count as an operation on the data
	 * @returns 
	 */
	insert(data, use = false) {
		// Make sure to desociate the data, especially if it is an instance
		let insertable = (data instanceof Object) ? { ...data } : data;
		use && this.cache.add(new DataCache(insertable, this, 1));

		return this.database.insert(insertable);
	};

	/**
	 * Delete the data. 
	 * 
	 * Data will be removed from the cache and the database, but will be returned here. 
	 * @async
	 * @param {Object} filter - the filter to use
	 */
	async pop(filter, ...arguments) {
		filter = this.filterify(filter);

		let matching = await this.select(filter, true, ...arguments);
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