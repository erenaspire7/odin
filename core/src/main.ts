import Fastify from "fastify";
import { RequestContext } from "@mikro-orm/core";
import { initMikroORM } from "@odin/core/db";
import { QueueService } from "./services";
import { app } from "./api";
import * as dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function bootstrap() {
  const orm = await initMikroORM();
  const server = Fastify({
    logger: true,
  });

  // register request context hook
  server.addHook("onRequest", (request, reply, done) => {
    RequestContext.create(orm.em, done);
  });

  // shut down the connection when closing the app
  server.addHook("onClose", async () => {
    await orm.close();
  });

  // Register your application as a normal plugin.
  server.register(app);

  const url = await server.listen({ port });

  console.log(`server started at ${url}`);
  
  // Initialize QueueService
  new QueueService(orm.em);

  return { server, url };
}

bootstrap();
