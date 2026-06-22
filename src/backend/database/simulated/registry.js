/**
 * @file src/backend/database/simulated/registry.js
 * @module database/simulated/registry
 * 
 * A registry for the simulated database collections
 * 
 * **Warning**: This is a simulated database and should not be used in production. Since it is only in-memory, any data stored here will be lost when the application is restarted.
 */

const Container = require(`./container`); 
const Logging = require(`../../utils/logging`); 

class Registry {
	static names = [`users`, `boards`, `comments`, `security`]; 

	/**
	 * The database collections
	 * @type {Object}
	 */
	collections = {};
	
	/**
	 * Load the collections. 
	 */
	load() {
		new Logging.Logging.Progress(`Loading collections…`).show();
		Registry.names.forEach((name) => {
			new Logging.Logging.Progress(new Logging.LogDetails(name, `Loading collection…`)).show();

			try {
				this.collections[name] = new Container(name);
				new Logging.Logging.success(new Logging.LogDetails(name, `Collection loaded.`)).show();
			} catch (error) {
				throw error;
			};
		});
		new Logging.Logging.success(`All collections loaded.`).show();
		return this;
	}

	/**
	 * @constructor
	 * Initializes the registry by creating a container for each collection name and logging the initialization process.
	 */
	constructor(load = true) {
		load && this.load();

		// Use the proxy such that if not a property of this object, get from the collections
		return new Proxy(this, {
			get(target, prop) {
				if (prop in target) {
					return target[prop];
				} else if (prop in target.collections) {
					return target.collections[prop];
				}; return undefined;
			},
			set(target, prop, value) {
				if (prop in target) {
					target[prop] = value;
					return true;
				} else if (prop in target.collections) {
					target.collections[prop] = value;
					return true;
				}; return false; 
			}
		});
	}
}

const Register = new Registry();

module.exports = {
	Register,
	Registry
};