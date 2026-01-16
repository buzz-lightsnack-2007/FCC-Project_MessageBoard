'use strict';
const Managers = require(`../scripts/server/instances.js`);
const Routes = require(`../scripts/server/routes/routes.js`);


const OutputProcessor = require(`../scripts/server/processing/input-output.js`);
const Response = require(`../scripts/server/controller.js`).Response

/**
 * Watch requests that deal with our API. 
 * @param {import("express").Request} request - The Express request object.
 * @param {import("express").Response} response - The Express response object.
 */
function watch(request, response) {
  return Managers.Connection.add(request, response, false);
}

module.exports = function (app) {
  Object.entries(Routes).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, RouteClass]) => {
      app[method.toLowerCase()](path, async (req, res) => {
        let connection = await watch(req, res);
        let output_processor = new OutputProcessor();

        output_processor.execute(async () => (await RouteClass.respond(connection)), RouteClass.type);

        let response = new Response();
        response.body = output_processor.content;
        response.status = output_processor.content?.code || 200;
        response.execute(connection);

        Managers.Connection.remove(connection); // done
      });
    });
  });
};
