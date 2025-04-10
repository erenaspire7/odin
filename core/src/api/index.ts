import * as path from "path";
import { FastifyInstance } from "fastify";
import AutoLoad from "@fastify/autoload";
import { verifySignature } from "./middleware/verifySignature";

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes/public"),
    options: { ...opts, prefix: "/api/public" },
  });

  fastify.register(
    async (protectedApp) => {
      // Apply the middleware only within this context
      protectedApp.addHook("preHandler", verifySignature);

      protectedApp.register(AutoLoad, {
        dir: path.join(__dirname, "routes/protected"),
        options: { ...opts },
      });
    },
    { ...opts, prefix: "/api/v1" },
  );
}
