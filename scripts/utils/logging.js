/**
 * Verbosity settings for logging
 */
class Verbosity {
    /**
     * Verbose connection logging
     * @type {Boolean}
     * @static
     */
    static connection = /^(1|true|yes|on|✓|☑️|\+)$/.test((process.env?.VERBOSE_CONNECTION || `-`).toString().trim().toLowerCase());

    /**
     * Verbose response logging
     * @type {Boolean}
     * @static
     */
    static response = /^(1|true|yes|on|✓|☑️|\+)$/.test((process.env?.VERBOSE_RESPONSES || `-`).toString().trim().toLowerCase());
};

/**
 * Format a log message
 * @param {Error|String} message - The log message 
 * @returns {String} The formatted log message
 */
function create_log(message) {
    return [
        ((message instanceof Error) || (message?.name && message?.message)) ? `\x1b[1m${message.name}:\x1b[0m ${message.message}` : message, 
        ((message instanceof Error) || [`cause`, `stack`].some((property) => (message[property]))) && [message?.cause ? `\nCaused by: ${message.cause}\n` : ``, message?.stack ? `\n${message.stack}` : ``].join(``) || ``
    ].join(``);
};

/**
 * Log entry
 * @class Log
 */
class Log {
    /**
     * The log message
     * @type {string}
     */
    message; 

    /**
     * Create a log entry
     * @constructor
     * @param {String} message - The log message
     */
    constructor(message) {
        message && (this.message = message);
    }

    /**
     * Print the log message to console
     * @method show
     */
    show() {
        let message = `\x1b[38;2;128;128;128m[${(new Date()).toISOString()}]\x1b[0m\t${create_log(this.message)}`;
        console.log(message);
        return message; 
    }
}

/**
 * Warning log entry
 * @class Log_Warning
 * @extends Log
 */
class Log_Warning extends Log {
    /**
     * Create a warning log entry
     * @constructor
     * @param {String} message - The log message
     */
    constructor(message) {
        super(message);
    }

    /**
     * The formatted warning message
     * @type {String}
     */
    get formatted() {
        return `\x1b[38;2;255;255;0m[${(new Date()).toISOString()}]\x1b[0m\t\x1b[33m⚠︎ Warning:\x1b[0m\t${create_log(this.message)}`;
    }

    /**
     * Print the warning log message to console
     * @method show
     */
    show() {
        console.warn(this.formatted);
        return this.formatted; 
    }
}

/**
 * Error log entry
 * @class Log_Error
 * @extends Log
 */
class Log_Error extends Log {
    /**
     * Create an error log entry
     * @constructor
     * @param {String} message - The log message
     */
    constructor(message) {
        super(message);
    }

    /**
     * The formatted error message
     * @type {String}
     */
    get formatted() {
        return `\x1b[38;2;255;0;0m[${(new Date()).toISOString()}]\x1b[0m\t\x1b[31m❌ Error:\x1b[0m\t${create_log(this.message)}`;
    };

    /**
     * Print the error log message to console
     * @method show
     */
    show() {
        console.error(this.formatted);
        return this.formatted; 
    };
};

module.exports = {
    Log,
    "Warning": Log_Warning,
    "Error": Log_Error, 
    Verbosity
};