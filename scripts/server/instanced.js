/**
 * @file instanced.js
 * Instanced server-side controller for connection management
 */

const ConnectionManager = require(`./controller.js`);

/**
 * The connection controller
 * @type {ConnectionManager.ConnectionManager}
 */
let Connection_Manager = new ConnectionManager.ConnectionManager();

// The Connection_Manager is exported, and any use of the Connection_Manager would basically refer to this instance! 
module.exports = Connection_Manager;