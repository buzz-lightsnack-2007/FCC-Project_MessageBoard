/**
 * Validation and authentication utilities
 * @module security/validator
 * @file validator.js
 */

/**
 * @require 
 */
const db = require(`../database/simulated/registry`).Register; 
const DataController = require(`../database/controller`).DataController; 
const Hash = require(`./code`).Hash; 
const securityMessaging = require(`./messaging`).Messages;

class Gate extends DataController {
	constructor() {
		super(db.security); 
	}; 
};

/**
 * @class UserPassword
 * The user-provided password
 */
class UserPassword {
	/**
	 * The user-provided password
	 * @type {String}
	 */
	password; 

	/**
	 * The ID of the resource being accessed
	 * @type {String|Number}
	 */
	id; 

	/**
	 * Creates a new UserPassword instance
	 * @param {String|Number} id - The ID of the resource being accessed
	 */
	constructor(id) {
		this.id = id; 
	};

	/**
	 * Validate the password
	 * @async
	 * @param {Object} to - Callback functions
	 * @param {Function} to.success - The callback function to call if the password is valid. Will be passed the ID of the resource being accessed.
	 * @param {Function} to.failure - The callback function to call if the password is invalid. Will be passed the ID of the resource being accessed.
	 * @returns {Boolean} Whether the password is valid
	 */
	async validate(to) {
		let gate = new Gate(); 
		let entry = await gate.select(this.id); 

		let hash = new Hash(entry?.hash); 
		const validity = hash.compare(this.password, !(to?.failure), this.id);

		if (to?.success && validity instanceof securityMessaging.Success) {
			return await to.success(this.id);
		} else if (to?.failure && validity instanceof securityMessaging.Failure) {
			return await to.failure(this.id);
		};

		return validity;
	};

	/**
	 * Set a password for a resource
	 * @async
	 * @param {Boolean} useID - Whether to use the ID of this instance as the ID of the resource being accessed. If false, a new ID will be generated for the resource and will replace the current ID of this instance.
	 */
	async set(useID = false) {
		let gate = new Gate(); 
		let hash = Hash.from(this.password); 

		let result = await gate.insert((useID && this.id) ? {hash: hash.hash, _id: this.id} : {hash: hash.hash});

		result.acknowledged && (this.id = result.inserted[0]); 

		return this.id; 
	};
};

module.exports = {UserPassword};