const zod = require(`zod`); 

/**
 * Logging details
 * @class LogDetails
 */
class LogDetails {
	/**
	 * Date
	 * @type {Date}
	 */
	date;

	/**
	 * Message body
	 * @type {String}
	 */
	message; 

	/**
	 * Message title
	 * @type {String}
	 */
	title; 

	/**
	 * @constructor
	 * @param {String} message - The message body to log.
	 * @param {String} [title] - An optional title for the log entry.
	 */
	constructor(message, title) {
		this.message = message;
		this.title = title;
		this.date = new Date();
	};
}

/**
 * Create a message to be logged to the server console.
 * @class Logging
 */
class Logging {
	/**
	 * Icon
	 * @type {String}
	*/
	icon; 
	
	/**
	 * Message
	 * @type {LogDetails}
	*/
	message; 
	
	/**
	 * Date
	 * @type {Date}
	 * @readonly
	 */
	get date() {return this.message?.date;};

	/**
	 * The display string
	 * @readonly
	 * @type {String}
	 * @param {string} [delimiter="\t"] the delimiter
	 */
	get display() {
		let message = [
			...(this.icon ? [[`\x1b[1m`, this.icon, `\x1b[0m`].join('')] : []),
			...(() => {
				if (!this.message) return []
				else if (this.message instanceof LogDetails) {
					let outputs = {
						"title": this.message.title ? [`\x1b[1m`, this.message.title, `\x1b[0m`].join('') : null,
						"message": this.message.message ? (() => {
							if (typeof this.message.message == `object`) {
								return JSON.stringify(this.message.message, null, 2);
							}
							return zod.coerce.string().trim().parse(this.message.message);
						})() : null
					};
					return Object.values(outputs).filter((item) => item);
				} else {
					return [String(this.message)];
				}; 
			})(),
			[`\x1b[2m`, `(`, this.date.toLocaleString(), `)`, `\x1b[0m`].join('')
		]; 

		return message.join('\t');
	};

	/**
	 * Output the message to the console. 
	 */
	show() {
		let display = this.display; 
		console.log(display);
		return display; 
	}; 

	/**
	 * Log a message to the server console.
	 * @constructor
	 * @param {LogDetails|string} message - The message to log.
	 * @param {string} [icon] - An optional icon to display with the message.
	 */
	constructor(message, icon) {
		this.message = (() => {
			if (message instanceof LogDetails) {
				return message;
			} else if (message) {
				message = zod.coerce.string().parse(message); 
				return new LogDetails(message);
			};
			return null; 
		})(); 
		this.icon = icon;
	}
};

/**
 * An informational log entry
 * @class Logging.Info
 */
Logging.info = class InfoMessage extends Logging {
	/**
	 * Log an informational message to the server console.
	 * @constructor
	 * @param {string} message - The message to log.
	 */
	constructor(message) {
		super(message, `ℹ`);
	}; 
}; 

/**
 * A log entry indicating progress
 * @class Logging.Progress
 */
Logging.Progress = class ProgressMessage extends Logging {
	/**
	 * The display string
	 * @readonly
	 * @type {String}
	 * @param {string} [delimiter="\t"] the delimiter
	 */
	get display() {
		let message = [
			...(this.icon ? [[`\x1b[1m`, `\x1b[5m`, `\x1b[33m`, this.icon, `\x1b[0m`].join('')] : []),
			...(() => {
				if (!this.message) return []
				else if (this.message instanceof LogDetails) {
					let outputs = {
						"title": this.message.title ? [`\x1b[1m`, `\x1b[33m`, this.message.title, `\x1b[0m`].join('') : null,
						"message": this.message.message ? (() => {
							if (typeof this.message.message == `object`) {
								return JSON.stringify(this.message.message, null, 2);
							}
							return zod.coerce.string().trim().parse(this.message.message);
						})() : null
					};
					return Object.values(outputs).filter((item) => item);
				} else {
					return [String(this.message)];
				}; 
			})(),
			[`\x1b[2m`, `(`, this.date.toLocaleString(), `)`, `\x1b[0m`].join('')
		]; 

		return message.join('\t');
	};

	/**
	 * Log a progress message. 
	 * @constructor
	 * @param {string} message - The message to log.
	 */
	constructor(message) {
		super(message, `⏳`);
	};
};


/**
 * A class that handles logging success messages to the server console.
 */
Logging.success = class SuccessMessage extends Logging {
	/**
	 * The display string
	 * @readonly
	 * @type {String}
	 * @param {string} [delimiter="\t"] the delimiter
	 */
	get display() {
		let message = [
			...(this.icon ? [[`\x1b[1m`, `\x1b[32m`, this.icon, `\x1b[0m`].join('')] : []),
			...(() => {
				if (!this.message) return []
				else if (this.message instanceof LogDetails) {
					let outputs = {
						"title": this.message.title ? [`\x1b[1m`, `\x1b[32m`, this.message.title, `\x1b[0m`].join('') : null,
						"message": this.message.message ? (() => {
							if (typeof this.message.message == `object`) {
								return JSON.stringify(this.message.message, null, 2);
							}
							return zod.coerce.string().trim().parse(this.message.message);
						})() : null
					};
					return Object.values(outputs).filter((item) => item);
				} else {
					return [String(this.message)];
				}; 
			})(),
			[`\x1b[2m`, `(`, this.date.toLocaleString(), `)`, `\x1b[0m`].join('')
		]; 

		return message.join('\t');
	};


	/**
	 * Log a success message to the server console.
	 * @constructor
	 * @param {string} message - The message to log.
	 */
	constructor(message) {
		super(message, `✓`);
	}
}
/**
 * A class that handles logging warning messages to the server console.
 */
Logging.warning = class WarningMessage extends Logging {
	/**
	 * Error
	 * @type {Error}
	 */
	error;

	/**
	 * The display string
	 * @readonly
	 * @type {String}
	 * @param {string} [delimiter="\t"] the delimiter
	 */
	get display() {
		let message = [
			...(this.icon ? [[`\x1b[1m`, `\x1b[33m`, this.icon, `\x1b[0m`].join('')] : []),
			...(() => {
				if (!this.message) return []
				else if (this.message instanceof LogDetails) {
					let outputs = {
						"title": this.message.title ? [`\x1b[1m`, `\x1b[33m`, this.message.title, `\x1b[0m`].join('') : null,
						"message": this.message.message ? (() => {
							if (typeof this.message.message == `object`) {
								return JSON.stringify(this.message.message, null, 2);
							}
							return zod.coerce.string().trim().parse(this.message.message);
						})() : null
					};
					return Object.values(outputs).filter((item) => item);
				} else {
					return [String(this.message)];
				}; 
			})(),
			[`\x1b[2m`, `(`, this.date.toLocaleString(), `)`, `\x1b[0m`].join('')
		]; 

		return message.join('\t');
	};

	/**
	 * Log a warning message to the server console.
	 * @constructor
	 * @param {string} message - The warning message to log.
	 */
	constructor(message) {
		super((message instanceof Error)
			? new LogDetails(`${message.message}${
					message.stack ? `\n\t>\t${message.stack.split(`\n`).join(`\n\t>\t`)}` : ``
				}`, message.name)
			: message, `⚠`);
		this.error = (message instanceof Error) ? message : undefined;
	};
}

/**
 * A class that handles logging error messages to the server console.
 */
Logging.error = class ErrorMessage extends Logging.warning {
	/**
	 * The display string
	 * @readonly
	 * @type {String}
	 * @param {string} [delimiter="\t"] the delimiter
	 */
	get display() {
		let message = [
			...(this.icon ? [[`\x1b[1m`, `\x1b[31m`, this.icon, `\x1b[0m`].join('')] : []),
			...(() => {
				if (!this.message) return []
				else if (this.message instanceof LogDetails) {
					let outputs = {
						"title": this.message.title ? [`\x1b[1m`, `\x1b[31m`, this.message.title, `\x1b[0m`].join('') : null,
						"message": this.message.message ? (() => {
							if (typeof this.message.message == `object`) {
								return JSON.stringify(this.message.message, null, 2);
							}
							return zod.coerce.string().trim().parse(this.message.message);
						})() : null
					};
					return Object.values(outputs).filter((item) => item);
				} else {
					return [String(this.message)];
				}; 
			})(),
			[`\x1b[2m`, `(`, this.date.toLocaleString(), `)`, `\x1b[0m`].join('')
		]; 

		return message.join('\t');
	};

	/**
	 * Log an error message to the server console.
	 * @constructor
	 * @param {string} message - The error message to log.
	 */
	constructor(message) {
		super(message); 
		this.icon = `✗`;
	};
}

export {Logging, LogDetails, Logging as default};