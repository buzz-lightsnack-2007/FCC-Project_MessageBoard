const helmet = require(`helmet`);
const Connection = require(`./controller.js`).Connection;

/**
 * Log an incoming request. 
 * @param {import("express").Request} request - The Express request object.
 * @param {import("express").Response} response - The Express response object.
 * @param {import("express").NextFunction} then - The next() callback to pass control to the next middleware.
 */
function log(request, response, then) {
	new Connection(request, response); // verbose logging without adding
	return then();
};

/**
 * Configure default security headers and middleware for the Express application.
 * Disables the X-Powered-By header and applies Helmet with CSP, XSS protection, frame options, referrer policy, and DNS prefetch controls.
 * @requires helmet
 * @param {import("express").Application} server - The Express server instance.
 * @returns {import("express").Application} The configured Express application.
 */
function config(server) {
	server.disable("x-powered-by");
	server.use(helmet({
		xDnsPrefetchControl: { allow: false },
		referrerPolicy: {
			policy: [`same-origin`]
		},
		xFrameOptions: { action: `sameorigin` },
		xXssProtection: true,
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: [`'self'`],
				objectSrc: [`'self'`],
				frameAncestors: [`'self'`]
			}
		}
	}));
	
	// When verbose mode is enabled, log everything
	require(`../utils/logging.js`).Verbosity.connection && server.use(log);
	
	// Return the instantiated server
	return (server);
};

module.exports = config;