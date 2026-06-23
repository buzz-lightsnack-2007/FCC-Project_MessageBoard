const DataController = require('../database/controller.js');
const db = require(`../database/simulated/registry.js`).Register; 
const Board = require(`./board/board.js`); 


class MessagesManager extends DataController {
	constructor() {
		super(db.comments); 
	}; 
};

class BoardsManager extends DataController {
	constructor() {
		super(db.users); 
	};
};

class MessagingManager {
	#controllers = {};

	constructor() {
		this.#controllers['messages'] = new MessagesManager();
		this.#controllers['boards'] = new BoardsManager();
	};


}