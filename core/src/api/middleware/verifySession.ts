import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";
import { verifyMessage } from "ethers";
import { z } from "zod";

export const verifySession = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  // @ts-ignore
  if (!request.session.siwe) {
    return reply.status(401).send({ error: "Authentication expired" });
  }
};
