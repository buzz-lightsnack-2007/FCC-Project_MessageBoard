/**
 * @file code.js
 * The data structure and methods for security-related features
 * 
 * @module security/code
 */
// Imports
const zod = require('zod');
const errors = require('common-errors');
let bcrypt = require('bcryptjs');
const logging = require(`../utils/logging`); 

let securityMessaging = require('./errors');

/**
 * The configuration for hashes
 * 
 * This configuration will be pulled from environment variables. 
 * 
 * @type {dict}
*/
const hash_config = {
	"native": process.env?.security_algorithms_useBcrypt || false,
	"rounds": process.env?.security_HashRounds || 13,
	"salt": process.env?.security_HashSalt
};

/**
 * Configures the hashing algorithm to use. Optionally, passing a verbose flag will print out the configuration being used.
 * 
 * @param {Boolean} verbose - Whether to print out the configuration being used
 * @param {String} delimiter - The delimiter to use when printing the configuration
 */
const config = (verbose = process.env?.verbose, delimiter = "\n\t- ") => {
	if (hash_config[`native`]) {
		try {
			bcrypt = require('bcrypt');
		} catch (error) {
			// If bcrypt is not available, fall back to bcryptjs
			new logging.Warning(logging.LogDetails(
				`Using bcryptjs ${error.message}`,
				`bcrypt unavailable`
			)).show(); 
		};
	};

	verbose && new logging.Info(logging.LogDetails(
		`Using the following authentication configuration: ${delimiter} ${Object.entries(hash_config).map(([key, value]) => `${key}: \t${!([undefined, null].includes(value)) ? value : `\x1b[2m(unspecified)\x1b[0m`}`).join(delimiter)}`,
		`Authentication Configuration`
	)).show();
};

config();

/**
 * @class Hash
 * A hash of a password, with methods to create and verify hashes
 */
class Hash {
	/**
	 * The hash
	 * @type {string}
	 */
	#hash;

	/**
	 * The hash
	 * @type {string}
	 * @readonly
	 */
	get hash() { return this.#hash; }

	/**
	 * @constructor
	 * Initializes a hash object with an existing hash string. 
	 * 
	 * Use this if the hash was already created and was, for example, stored in a database. 
	 * 
	 * @param {string|Hash} hash 
	 */
	constructor(hash) {
		if (zod.string().safeParse(hash).success) {
			this.#hash = hash;
		} else {
			this.#hash = hash?.hash; 
		};
	};

	/**
	 * Generate a hash from a password string.
	 * 
	 * @param {string} password - the password
	 * @param {Number} [rounds = hash_config.rounds] - the number of rounds to use for hashing
	 * @param {string} [salt = hash_config.salt] - the salt to use for hashing
	 * @returns {Hash} The generated hash
	 */
	static from(password, rounds = hash_config['rounds'], salt = hash_config['salt']) {
		rounds = zod.number().gte(0).parse((typeof rounds == `function`) ? rounds() : rounds);

		salt = (zod.string().safeParse(salt).success && salt) || bcrypt.genSaltSync(rounds);

		const hash = bcrypt.hashSync(password, salt);
		return new Hash(hash);
	};

	/**
	 * Compare a password to the hash.
	 * 
	 * @method compare
	 * @param {string} password - the password to compare
	 * @param {boolean} [raise = false] - whether to throw an error if the password does not match
	 * @param {string|Number} [id = null] - the ID of the resource being accessed, if available
	 * @returns {Boolean} Whether the password matches the hash
	 * @throws {securityMessaging.AuthenticationError|securityMessaging.AuthenticationRequiredError} If the password does not match the hash and `raise` is true
	 */
	compare(password, raise = false, id = null) {
		const result = bcrypt.compareSync(password, this.#hash);

		if (!result && raise) {
			throw new securityMessaging[(password) ? `AuthenticationError` : `AuthenticationRequiredError`](id);
		}; 
		return result; 
	};

	/**
	 * Gets the salt portion from the hash. 
	 * 
	 * @returns {string} The salt portion of the hash
	 */
	get salt() {
		return bcrypt.getSalt(this.#hash);
	}
};

module.exports = {
	Hash,
	hash_config
};