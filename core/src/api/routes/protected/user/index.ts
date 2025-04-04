import { FastifyInstance } from "fastify";
import { AuthHeadersSchema, AuthMessageSchema } from "@odin/core/utils";
import { UserService } from "@odin/core/services";

export default async function (fastify: FastifyInstance) {
  fastify.post("/register", async (request, reply) => {
    const { userAddress } = AuthHeadersSchema.parse(request.headers);

    const userService = new UserService();

    await userService.register({ walletAddress: userAddress });

    reply.status(201).send();
  });
}
