const helmet = require(`helmet`);

/**
 * Log an incoming request. 
 * @param {import("express").Request} request - The Express request object.
 * @param {import("express").Response} response - The Express response object.
 * @param {import("express").NextFunction} then - The next() callback to pass control to the next middleware.
 */
function log(request, response, then) {
	console.log(`\x1b[38;2;128;128;128m[${(new Date()).toLocaleString()}]\x1b[0m \x1b[1m${request.ip}\x1b[0m ${request.method}: \x1b[38;2;0;0;255m${request.path}\x1b[0m${(request?.query && Object.entries(request.query).length && ` ${JSON.stringify(request.query)}`) || ``}`);
	then();
};

/**
 * Configure default security headers and middleware for the Express application.
 * Disables the X-Powered-By header and applies Helmet with CSP, XSS protection, frame options, referrer policy, and DNS prefetch controls.
 * @requires helmet
 * @param {import("express").Application} server - The Express server instance.
 * @param {boolean} [verbose=true] - Whether to enable verbose logging.
 * @returns {import("express").Application} The configured Express application.
 */
function config(server, verbose = true) {
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
	verbose && server.use(log);
	
	return (app);
};

module.exports = config;