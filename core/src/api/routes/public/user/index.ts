import { FastifyInstance } from "fastify";
import { SiweVerifySchema } from "@odin/core/types";
import { UserService } from "@odin/core/services";
import { generateNonce } from "siwe";
import {
  getAddressFromMessage,
  getChainIdFromMessage,
} from "@reown/appkit-siwe";
import { createPublicClient, http } from "viem";

const projectId = process.env.APPKIT_PROJECT_ID!;

export default async function (fastify: FastifyInstance) {
  fastify.get("/nonce", async (request, reply) => {
    reply.header("Content-Type", "text/plain");
    reply.send(generateNonce());
  });

  fastify.post("/verify", async (request, reply) => {
    try {
      const { message, signature } = SiweVerifySchema.parse(request.body);

      const address = getAddressFromMessage(message);
      let chainId: any = getChainIdFromMessage(message);

      const publicClient = createPublicClient({
        transport: http(
          `https://rpc.walletconnect.org/v1/?chainId=${chainId}&projectId=${projectId}`,
        ),
      });

      const isValid = await publicClient.verifyMessage({
        message,
        address: address as `0x${string}`,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        // throw an error if the signature is invalid
        throw new Error("Invalid signature");
      }
      if (chainId.includes(":")) {
        chainId = chainId.split(":")[1];
      }

      chainId = Number(chainId);

      if (isNaN(chainId)) {
        throw new Error("Invalid chainId");
      }

      const userService = new UserService();
      await userService.register({ walletAddress: address });

      // @ts-ignore
      request.session.siwe = { address, chainId };
      request.session.save(() => reply.status(200).send(true));
    } catch (err) {
      // @ts-ignore
      request.session.siwe = null;
      // @ts-ignore
      request.session.nonce = null;
    }
  });

  fastify.get("/session", async (request, reply) => {
    reply.header("Content-Type", "application/json");
    // @ts-ignore
    reply.send(request.session.siwe);
  });

  fastify.get("/signout", async (request, reply) => {
    // @ts-ignore
    request.session.siwe = null;
    // @ts-ignore
    request.session.nonce = null;
    request.session.save(() => reply.send({}));
  });
}
