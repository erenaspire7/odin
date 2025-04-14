import { FastifyInstance } from "fastify";
import { CreateBountyPayloadSchema } from "@odin/core/types";
import { BountyService } from "@odin/core/services";

interface GetQueryParams {
  page?: number;
  limit?: number;
  type?: string;
}

export default async function (fastify: FastifyInstance) {
  fastify.post("/create", async (request, reply) => {
    // @ts-ignore
    const { address } = request.session.siwe;

    const bountyService = new BountyService();

    console.log(request.body);

    const payload = CreateBountyPayloadSchema.parse(request.body);

    // console.log(JSON.stringify(payload.error));

    // @ts-ignore
    await bountyService.createBounty(payload, address);

    reply.status(201).send();
  });

  fastify.get("/all", async (request, reply) => {
    // @ts-ignore
    const { address } = request.session.siwe;

    const bountyService = new BountyService();
    const { page, limit, type } = request.query as GetQueryParams;
    const filters = type ? { type } : {};

    const bounties = await bountyService.getBounties(
      address,
      { page, limit },
      filters,
    );

    reply.status(200).send(bounties);
  });
}
