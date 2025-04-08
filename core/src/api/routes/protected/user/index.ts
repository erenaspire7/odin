import { FastifyInstance } from "fastify";
import { AuthHeadersSchema } from "@odin/core/types";
import { UserService } from "@odin/core/services";

export default async function (fastify: FastifyInstance) {

  fastify.post("/register", async (request, reply) => {
    const { walletAddress } = AuthHeadersSchema.parse(request.headers);

    const userService = new UserService();

    await userService.register({ walletAddress });

    reply.status(201).send();
  });
}
