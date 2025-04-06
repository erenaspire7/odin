import { Bounty, User } from "@odin/core/db";
import { EntityRepository } from "@mikro-orm/postgresql";
import { CreateBountyPayload } from "@odin/core/types";

export class BountyRepository extends EntityRepository<Bounty> {
  async getBounty(bountyId: string): Promise<Bounty | null> {
    return await this.findOne({ bountyId });
  }

  createBounty(payload: CreateBountyPayload & { creator: User }) {
    const {
      name,
      description,
      expiresAt,
      expectedOutput,
      evaluationCriteria,
      prize,
      type,
      status,
      creator,
    } = payload;

    const bounty = new Bounty(
      name,
      description,
      creator,
      expiresAt,
      expectedOutput,
      evaluationCriteria,
      prize,
      type,
      status,
    );

    this.getEntityManager().persist(bounty);

    return bounty;
  }
}
