const Route = require(`./route.js`);
const Instances = require(`../instances.js`);

/**
 * @type {Object<String, Object<String, Route>>}
 */
const Routes = {
	"/api/threads/:board": {
		"POST": class extends Route {
			static type = require(`../formats/response/messages/units.js`).ViewingThreadResponse

			/**
			 * @async
			 * @param {import('../controller.js').Connection} conn 
			 */
			static async respond(conn) {
				let boardID = conn.request.params.board;
				let board = await Instances.Messages.find(boardID, true);
				let thread = board.create();

				thread.text = conn.request.body?.text;
				thread._key = conn.request.body?.delete_password;

				return thread;
			}
		}, 
		"GET": class extends Route {
			static type = require(`../formats/response/messages/units.js`).Board_View

			/**
			 * @async
			 * @param {import('../controller.js').Connection} conn 
			 */
			static async respond(conn) {
				let boardID = conn.request.params.board;
				let board = await Instances.Messages.find(boardID);
				
				return board;
			}
		}, 
		"DELETE": class extends Route {
			static type = require(`../formats/response/messages/statuses.js`).Deletion_Status_View

			/**
			 * @async
			 * @param {import('../controller.js').Connection} conn 
			 */
			static async respond(conn) {
				const IDs = {
					"board": conn.request.params.board,
					"thread": conn.request.body?.thread_id,
				}

				let boardID = conn.request.params.board;
				let board = await Instances.Messages.find(boardID);
				
				return board.delete(IDs.thread, conn.request.body?.delete_password);
			};
		},
	}, 
	"/api/replies/:board": {
		"POST": class extends Route {
			static type = require(`../formats/response/messages/units.js`).AddedMessagesResponse

			/**
			 * @async
			 * @param {import('../controller.js').Connection} conn 
			 */
			static async respond(conn) {
				let boardID = conn.request.params.board;
				let board = await Instances.Messages.find(boardID);
				let thread = await board.find(conn.request.body?.thread_id);
				let message = thread.create();

				message.text = conn.request.body?.text;
				message._key = conn.request.body?.delete_password;

				return (message);
			};
		},
		"GET": class extends Route {
			static type = require(`../formats/response/messages/units.js`).Replies_View

			/**
			 * @async
			 * @param {import('../controller.js').Connection} conn
			 */
			static async respond(conn) {
				let boardID = conn.request.params.board;
				let board = await Instances.Messages.find(boardID);
				let thread = await board.find(conn.request.query?.thread_id);
				return thread;
			};
		},
		"DELETE": class extends Route {
			static type = require(`../formats/response/messages/statuses.js`).Deletion_Status_View
			/**
			 * @async
			 * @param {import('../controller.js').Connection} conn 
			 */
			static async respond(conn) {
				const IDs = {
					"board": conn.request.params.board,
					"thread": conn.request.body?.thread_id,
					"reply": conn.request.body?.reply_id,
				}
				let boardID = conn.request.params.board;
				let board = await Instances.Messages.find(boardID);
				let thread = await board.find(IDs.thread);
				return thread.delete(IDs.reply, conn.request.body?.delete_password);
			};
		}
	}
}

module.exports = Routes;