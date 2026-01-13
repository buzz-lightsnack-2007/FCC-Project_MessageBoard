const bcrypt = require(`bcryptjs`);
const z = require(`zod`).z;
const errors = require(`common-errors`);

/**
 * A regular express for BCrypt hashes
 * @type {RegExp}
 */
const BCrypt_RegEx = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * An authentication key
 * @class Authkey
 */
class AuthKey {	
	/**
	 * The original value
	 * @type {String}
	 * @private
	 */
	#value;

	/**
	 * The bcrypt hash
	 * @private
	 * @type {String}
	 */
	#hash;

	/**
	 * The BCrypt hash
	 * 
	 * The hash can only be configured during initialization. 
	 * 
	 * @readonly
	 * @type {String}
	 */
	get hash() {
		return (this.#hash || (
			/**
			 * Generate the hash. 
			 */
			() => {
				this.#salt = bcrypt.genSaltSync(process.env?.SECURITY_STRENGTH || 11);
				
				/**
				 * The generated hash
				 */
				let hash = bcrypt.hashSync(this.#value, this.#salt);
				this.#hash = hash;
				return (hash);
		})());
	};

	/**
	 * The salt
	 * @private
	 * @type {String}
	 */
	#salt; 
	
	/**
	 * The salt
	 * @readonly
	 * @type {String}
	 */
	get salt() {
		return (this.#salt || (this.#hash && bcrypt.getSalt(this.#hash)) || undefined);
	}

	/**
	 * The number of rounds used to encrypt the hash
	 * @type {Number}
	 */
	get rounds() {
		return (this.#hash && bcrypt.getRounds(this.#hash)) || undefined;
	}

	/**
	 * Test if a provided key matches
	 * 
	 * @function test
	 * @param {String} value - the value to test
	 * @returns {Boolean} whether 
	 */
	test(value) {
		return ((this.#value) ? 
			/**
			 * If the original value is still cached in memory, use that. It’s not ideal. 
			 * @returns {Boolean}
			 */
			() => (this.#value == value) : 
			/**
			 * Compare the hashes. 
			 * @returns {Boolean}
			 */
			() => (bcrypt.compareSync(value, this.hash)))()
	};

	/**
	 * Test if a provided key matches
	 * 
	 * While this uses `AuthKey.test` under the hood, this is exclusively a setter, and it will throw an error when the authentication fails. 
	 * 
	 * @param {String} value - The value to test
	 * @throws {z.ZodError} if the input can not be tested
	 * @throws {errors.AuthenticationRequiredError} if the authentication fails
	 */
	set input(value) {
		let password = z.coerce.string().min(1).parse(value);
		if (!(this.test(password))) {
			throw errors.AuthenticationRequiredError(`incorrect password`);
		};
	};

	/**
	 * Remove the cached original value by setting this to a truish value. It can only be run when the hash has been generated, and ideally, it can must only be run once. 
	 * @param {Boolean} confirmation
	 * @throws {errors.InvalidOperationError} When deleting the value without having generated the hash yet
	 */
	set obfuscated(value) {
		return (value && (this.#hash || (() => {
			throw errors.InvalidOperationError(`deleting the value (hash hasn’t been generated yet)`);
		})()) && (() => {
			this.#value = undefined; // Clear the original value
		})());
	};

	/**
	 * @constructor
	 * @param {Key|String} content 
	 */
	constructor(content) {
		if (content) {
			if (content instanceof AuthKey) {
				// Import it without being it
				this.#hash = content.#hash;
				this.#salt = content.#salt;
				this.#value = content.#value;
			} else {
				const key = z.coerce.string().parse(content);
				if (BCrypt_RegEx.test(key)) {
					this.#hash = key;
				} else {
					this.#value = key;
				}
			}
		}
	}
};
AuthKey.RegEx = BCrypt_RegEx;

module.exports = AuthKey;