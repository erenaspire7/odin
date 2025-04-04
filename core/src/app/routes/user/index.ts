import { FastifyInstance } from "fastify";
import { RequestContext } from "@mikro-orm/core";

export default async function (fastify: FastifyInstance) {
  fastify.post("/register", async (request, reply) => {
    // zod schema checks
    // Your code here
    // const em = RequestContext.getEntityManager();
  });
}
