import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";
import { verifyMessage } from "ethers";
import { z } from "zod";
import { AuthHeadersSchema, AuthMessageSchema } from "@odin/core/utils";

export const verifySignature = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  try {
    const { userAddress, signature } = AuthHeadersSchema.parse(request.headers);

    const message = verifyMessage(userAddress, signature);

    if (!message) {
      return reply.status(400).send({ error: "Invalid signature" });
    }

    // Safely parse and validate the message
    const jsonData = JSON.parse(message);
    const messageData = AuthMessageSchema.parse(jsonData);

    // Check if the message has expired
    const expiryTime = new Date(messageData.expiresAt).getTime();
    const currentTime = Date.now();

    if (currentTime > expiryTime) {
      return reply.status(401).send({ error: "Authentication expired" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply
        .code(400)
        .send({ error: "Invalid headers", details: error.errors });
    }

    return reply.code(500).send({ error: "Authentication failed" });
  }
};
