import * as path from "path";
import { FastifyInstance } from "fastify";
import AutoLoad from "@fastify/autoload";
import FastifySession from "@fastify/session";
import FastifyCookie from "@fastify/cookie";
import FastifyCors from "@fastify/cors";

import { verifySession } from "./middleware/verifySession";

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

  fastify.register(FastifyCookie);
  fastify.register(FastifySession, {
    cookieName: "siwe-quickstart",
    secret: process.env.APP_SECRET!,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true },
  });
  fastify.register(FastifyCors, {
    origin: ["http://localhost:5173"],
    credentials: true,
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
      protectedApp.addHook("preHandler", verifySession);

      protectedApp.register(AutoLoad, {
        dir: path.join(__dirname, "routes/protected"),
        options: { ...opts },
      });
    },
    { ...opts, prefix: "/api/v1" },
  );
}
