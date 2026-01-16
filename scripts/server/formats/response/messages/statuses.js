const z = require(`zod`).z;
const Template = require(`../template.js`);

/**
 * A status message in the form of a string
 * 
 * @class StatusMessage
 * @extends {Template.ResponseData}
 * @property {Boolean} result - whether the status indicates success
 */
class StatusMessage extends Template.ResponseData {
	/**
	 * @constructor
	 * @param {*} data - Status message
	 */
	constructor(data) {
		/**
		 * @type {Boolean} - whether the status indicates success
		 * @protected
		 */
		super(...arguments);
	};

	/**
	 * Response messages associated with the status
	 * 
	 * Default message: "success" for success (`true`), "no" for failure (`false`)
	 * 
	 * @type {String[]}
	 */
	messages = [`no`, `success`];
	
	get content() {
		return this.messages[new Number(this.result)]; 
	}

	/**
	 * @param {*} data - raw status data
	 */
	_import(data) {
		this.result = !!((typeof data?.valueOf) == `function` 
			? data.valueOf() // if a primitive wrapper, unwrap it
			: data); 
		return this;
	}
};

class Deletion_Status_View extends StatusMessage {
	/**
	 * @constructor
	 * @param {import('../../../../messaging/status.js').Deletion_Status} data - Status message
	 */
	constructor(data) {
		super(...arguments);
	}
};

class Flagging_Status_View extends StatusMessage {
	/**
	 * @constructor
	 * @param {import('../../../../messaging/status.js').Reported_State} data - Status message
	 */
	constructor(data) {
		super(...arguments);
	};
	messages = [`not reported`, `reported`];
};

module.exports = {
	StatusMessage,
	Deletion_Status_View,
	Flagging_Status_View
};