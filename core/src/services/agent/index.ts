import { RequestContext } from "@mikro-orm/core";
import {
  Agent,
  AgentRepository,
  User,
  UserRepository,
  Bounty,
  BountyRepository,
} from "@odin/core/db";
import {
  AgenticResponseType,
  EnrollAgentPayload,
  BountyExpectedOutput,
} from "@odin/core/types";
import {
  randomUUID,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto";
import { ethers } from "ethers";
import lighthouse from "@lighthouse-web3/sdk";
import { validateSchema } from "@odin/core/utils";

export class AgentService {
  private readonly agentRepository: AgentRepository;
  private readonly userRepository: UserRepository;
  private readonly bountyRepository: BountyRepository;

  private algorithm = "aes-256-cbc";
  private key = Buffer.from(process.env.APP_KEY!, "hex");
  private iv = Buffer.from(process.env.APP_IV!, "hex");

  constructor() {
    this.agentRepository =
      RequestContext.getEntityManager()!.getRepository(Agent);

    this.userRepository =
      RequestContext.getEntityManager()!.getRepository(User);

    this.bountyRepository =
      RequestContext.getEntityManager()!.getRepository(Bounty);
  }

  generateSecret(expiresAt: Date) {
    const nonce = randomBytes(16).toString("hex");
    const timestamp = Date.now();

    const message = `Sign this message to authenticate: ${nonce}-${timestamp}`;

    const challenge = {
      message,
      expires: expiresAt.getTime(),
    };

    const cipher = createCipheriv(this.algorithm, this.key, this.iv);

    let encrypted = cipher.update(JSON.stringify(challenge), "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
  }

  validateFinalAnswer(finalAnswer: any, expectedOutput: BountyExpectedOutput) {
    const { format, schema } = expectedOutput;

    switch (format) {
      case "json":
        if (!validateSchema(schema, finalAnswer)) {
          throw new Error("Invalid JSON");
        }

        break;
      default:
        throw new Error("Unsupported format");
    }
  }

  async enroll(payload: EnrollAgentPayload) {
    const { walletAddress, bountyId } = payload;

    const creator = await this.userRepository.getUser(walletAddress);

    if (!creator) throw new Error("User not found");

    const bounty = await this.bountyRepository.getBounty(bountyId);

    if (!bounty) throw new Error("Bounty not found");

    const existingAgent = await this.agentRepository.getAgentByBounty(
      bountyId,
      walletAddress,
    );

    if (bounty.creator.walletAddress == walletAddress) {
      throw new Error("Creator cannot enroll as agent");
    }

    if (existingAgent) throw new Error("Agent already enrolled");

    const webhookUrl = `public/webhooks/${randomUUID()}`;

    const webhookSecret = this.generateSecret(bounty.expiresAt);

    return this.agentRepository.createAgent({
      creator,
      bounty,
      webhookUrl,
      webhookSecret,
    });
  }

  async decryptSecret(webhookSecret: string) {
    const decipher = createDecipheriv(this.algorithm, this.key, this.iv);

    let decrypted = decipher.update(webhookSecret, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }

  async submitAgenticResponse(
    agenticResponse: AgenticResponseType,
    signature: string,
    uniqueId: string,
  ) {
    const { agentId, finalAnswer } = agenticResponse;

    const agent = await this.agentRepository.getAgent(agentId);

    if (!agent) throw new Error("Agent not found");

    if (!agent.webhookUrl.includes(uniqueId)) {
      throw new Error("Invalid webhook URL");
    }

    await this.verifySignature(agent, signature);

    const { expectedOutput } = agent.bounty;

    this.validateFinalAnswer(finalAnswer, expectedOutput);

    const { data } = await lighthouse.uploadText(
      JSON.stringify(agenticResponse),
      process.env.LIGHTHOUSE_API_KEY!,
    );

    const filecoinCid = data.Hash;

    const changes = { filecoinCid, validated: true };

    await this.agentRepository.updateAgent(agent, changes);

    // trigger evaluation
  }

  async verifySignature(agent: Agent, signature: string) {
    const challenge = await this.decryptSecret(agent.webhookSecret);

    if (challenge.expires < Date.now()) {
      throw new Error("Challenge expired");
    }

    const recoveredAddress = ethers.verifyMessage(challenge.message, signature);

    if (recoveredAddress !== agent.creator.walletAddress) {
      throw new Error("Invalid signature");
    }
  }
}
