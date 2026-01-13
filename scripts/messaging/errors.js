const Errors = require(`common-errors`);

class NotFoundError_MessagingController extends Errors.NotFoundError {
	/**
	 * The ID in question
	 * @type {String|Number}
	 */
	ID; 

	/**
	 * @constructor
	 * @param {String} type - the type that wasn’t found
	 * @param {String|Number} ID - the ID in question
	 * @param {Error} error - any internal error
	 */
	constructor(type, ID, error) {
		super(type, error);
		this.ID = ID;
	};

	/**
	 * Error code (convertible to HTTP status code)
	 * @type {Number}
	 */
	code = 404;
}

class NotFoundError_Board extends NotFoundError_MessagingController {
	/**
	 * @constructor
	 * @param {String|Number} ID - the ID in question
	 * @param {Error} error - any internal error
	 */
	constructor(ID, error) {
		super(`board`, ID, error);
	};
};

class NotFoundError_Thread extends NotFoundError_MessagingController {
	/**
	 * @constructor
	 * @param {String|Number} ID - the ID in question
	 * @param {Error} error - any internal error
	 */
	constructor(ID, error) {
		super(`thread`, ID, error);
	};
};

class NotFoundError_Message extends NotFoundError_MessagingController {
	/**
	 * @constructor
	 * @param {String|Number} ID - the ID in question
	 * @param {Error} error - any internal error
	 */
	constructor(ID, error) {
		super(`message`, ID, error);
	};
};

module.exports = {
	NotFoundError_Board,
	NotFoundError_Thread,
	NotFoundError_Message
};