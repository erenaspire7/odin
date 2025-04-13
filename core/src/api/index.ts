import * as path from "path";
import { FastifyInstance } from "fastify";
import AutoLoad from "@fastify/autoload";
import FastifySession from "@fastify/session";
import FastifyCookie from "@fastify/cookie";
import FastifyCors from "@fastify/cors";
import { verifySession } from "./middleware/verifySession";
import fs from "fs";

const sessionDir = path.join( "/home/erenaspire7/Projects/personal/odin/core/tmp");
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir);
}

// Simple file-based session store
const fileStore = {
  get: (sessionId: any, callback: any) => {
    const sessionPath = path.join(sessionDir, `${sessionId}.json`);
    try {
      if (fs.existsSync(sessionPath)) {
        const data = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
        callback(null, data);
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(err, null);
    }
  },
  set: (sessionId: any, session: any, callback: any) => {
    const sessionPath = path.join(sessionDir, `${sessionId}.json`);
    try {
      fs.writeFileSync(sessionPath, JSON.stringify(session));
      callback();
    } catch (err) {
      callback(err);
    }
  },
  destroy: (sessionId: any, callback: any) => {
    const sessionPath = path.join(sessionDir, `${sessionId}.json`);
    try {
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
      }
      callback();
    } catch (err) {
      callback(err);
    }
  },
};

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
    store: fileStore,
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
