/**
 * @file instanced.js
 * Instanced server-side controllers
 */
const ConnectionManager = require(`./controller.js`).ConnectionManager;
const MessagingManager = require(`../messaging/controller.js`)

/**
 * 
 */
const Managers = {
	"Connection": new ConnectionManager(), 
	"Messages": new MessagingManager()
}

// The Connection_Manager is exported, and any use of the Connection_Manager would basically refer to this instance! 
module.exports = Managers;