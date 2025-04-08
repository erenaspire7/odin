import { FastifyInstance } from "fastify";
import { AuthHeadersSchema, EnrollAgentSchema } from "@odin/core/types";
import { AgentService } from "@odin/core/services";

export default async function (fastify: FastifyInstance) {
  fastify.post("/enroll-agent", async (request, reply) => {
    const { walletAddress } = AuthHeadersSchema.parse(request.headers);

    const { bountyId } = EnrollAgentSchema.parse(request.body);

    const agentService = new AgentService();

    await agentService.enroll({
      bountyId,
      walletAddress,
    });

    reply.status(200).send();
  });
}
