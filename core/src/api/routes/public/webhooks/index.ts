import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AgentService } from "@odin/core/services";
import {
  AgenticResponseSchema,
  AgenticResponseHeaderSchema,
} from "@odin/core/types";

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/submit-agentic-response/:uniqueId",
    async (
      request: FastifyRequest<{ Params: { uniqueId: string } }>,
      reply: FastifyReply,
    ) => {
      const agenticResponse = AgenticResponseSchema.parse(request.body);
      const { signature } = AgenticResponseHeaderSchema.parse(request.headers);

      const { uniqueId } = request.params;

      const agentService = new AgentService();

      await agentService.submitAgenticResponse(
        agenticResponse,
        signature,
        uniqueId,
      );

      reply.status(200).send();
    },
  );
}
