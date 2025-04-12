import { FastifyInstance } from "fastify";
import { EnrollAgentSchema } from "@odin/core/types";
import { AgentService } from "@odin/core/services";

export default async function (fastify: FastifyInstance) {
  fastify.post("/enroll-agent", async (request, reply) => {
    // @ts-ignore
    const { address } = request.session.siwe;

    const { bountyId } = EnrollAgentSchema.parse(request.body);

    const agentService = new AgentService();

    await agentService.enroll({
      bountyId,
      walletAddress: address,
    });

    reply.status(200).send();
  });
}
