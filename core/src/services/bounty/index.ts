import { RequestContext } from "@mikro-orm/core";
import { User, UserRepository, BountyRepository, Bounty } from "@odin/core/db";
import { CreateBountyPayload } from "@odin/core/types";
import { validateSchema } from "@odin/core/utils";

export class BountyService {
  private userRepository: UserRepository;
  private bountyRepository: BountyRepository;

  constructor() {
    this.userRepository =
      RequestContext.getEntityManager()!.getRepository(User);

    this.bountyRepository =
      RequestContext.getEntityManager()!.getRepository(Bounty);
  }

  async createBounty(payload: CreateBountyPayload, walletAddress: string) {
    const creator = await this.userRepository.getUser(walletAddress);

    if (!creator) {
      throw new Error("User not found");
    }

    const { format, schema } = payload.expectedOutput;

    switch (format) {
      case "json":
        validateSchema(schema);
        break;

      default:
        throw new Error("Unsupported format");
    }

    return this.bountyRepository.createBounty({
      ...payload,
      creator,
    });
  }

  async modifyBounty(
    bountyId: string,
    payload: CreateBountyPayload,
    walletAddress: string,
  ) {
    const creator = await this.userRepository.getUser(walletAddress);

    if (!creator) {
      throw new Error("User not found");
    }

    const { format, schema } = payload.expectedOutput;

    switch (format) {
      case "json":
        validateSchema(schema);
        break;

      default:
        throw new Error("Unsupported format");
    }

    const bounty = await this.bountyRepository.getBounty(bountyId);

    if (!bounty) {
      throw new Error("Bounty not found");
    }

    if (bounty.creator.userId !== creator.userId) {
      throw new Error("Unauthorized");
    }

    return this.bountyRepository.updateBounty(bounty, payload);
  }

  async getBounties(
    address: any,
    options?: { page?: number; limit?: number },
    filters?: any,
  ) {
    const creator = await this.userRepository.getUser(address);

    if (!creator) {
      throw new Error("User not found");
    }

    return this.bountyRepository.getBounties(creator, options, filters);
  }
}
