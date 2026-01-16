/**
 * A status class
 * 
 * @class Status
 * @extends Boolean
 */
class Status extends Boolean {
	/**
	 * Original data supplied to this status
	 * @type {*[]}
	 */
	args; 

	/**
	 * Prepare a new status. 
	 * @constructor
	 * @param {*} state - the current state
	 */
	constructor(state) {
		super((arguments.length && Array.from(arguments).every((value) => (((typeof value?.valueOf).includes(`func`)) ? value.valueOf() : !!value))));
		this.args = Array.from(arguments);
	};
};

/**
 * The flagging status
 * @class Reported_State
 * @extends Status
 */
class Reported_State extends Status {
	/**
	 * Prepare a new flagging status.
	 * @constructor 
	 * @param {Boolean} state - the current flagging status 
	 */
	constructor(state) {
		super(...arguments);
	};
}; 

/**
 * The deletion status
 * 
 * This status is meant for internal communication and is not used in any message cache. 
 * 
 * @class Deletion_Status
 * @extends Status
 */
class Deletion_Status extends Status {
	/**
	 * Prepare a deletion report. 
	 * @constructor
	 * @param {Boolean} state - the deletion status
	 */
	constructor(state) {
		super(...arguments);
	};
};

module.exports = {Status, Reported_State, Deletion_Status}