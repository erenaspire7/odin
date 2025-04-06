import { FastifyInstance } from "fastify";
import { AuthHeadersSchema, CreateBountyPayloadSchema } from "@odin/core/types";
import { BountyService } from "@odin/core/services";

export default async function (fastify: FastifyInstance) {
  const bountyService = new BountyService();

  fastify.post("/create", async (request, reply) => {
    const { walletAddress } = AuthHeadersSchema.parse(request.headers);

    const payload = CreateBountyPayloadSchema.parse(request.body);

    await bountyService.createBounty(payload, walletAddress);

    reply.status(201).send();
  });
}
