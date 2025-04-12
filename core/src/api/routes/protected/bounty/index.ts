import { FastifyInstance } from "fastify";
import { CreateBountyPayloadSchema } from "@odin/core/types";
import { BountyService } from "@odin/core/services";

export default async function (fastify: FastifyInstance) {
  fastify.post("/create", async (request, reply) => {
    // @ts-ignore
    const { address } = request.session.siwe;

    const bountyService = new BountyService();

    const payload = CreateBountyPayloadSchema.parse(request.body);

    await bountyService.createBounty(payload, address);

    reply.status(201).send();
  });
}
