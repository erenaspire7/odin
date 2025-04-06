import { RequestContext } from "@mikro-orm/core";
import { User, UserRepository, BountyRepository, Bounty } from "@odin/core/db";
import { CreateBountyPayload } from "@odin/core/types";
import { Draft, draft2019Config } from "json-schema-library";

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
        new Draft(draft2019Config, schema);
        break;

      default:
        throw new Error("Unsupported format");
    }

    return this.bountyRepository.createBounty({
      ...payload,
      creator,
    });
  }
}
