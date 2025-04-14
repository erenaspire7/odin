import { Bounty, User } from "@odin/core/db";
import { EntityRepository, wrap } from "@mikro-orm/postgresql";
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
      difficulty,
      tags,
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
      difficulty,
      tags,
    );

    this.getEntityManager().persist(bounty);

    return bounty;
  }

  async getBounties(
    user: any,
    options?: { page?: number; limit?: number },
    filters?: any,
  ) {
    let offset;

    if (options?.page) {
      offset = (options.page - 1) * (options.limit || 10);
    }

    return await this.find(
      {
        ...(filters ?? {}),
        creator: {
          $ne: user,
        },
      },
      { limit: options?.limit || 10, offset },
    );
  }

  async updateBounty(bounty: Bounty, changes: any) {
    const updatedBounty = wrap(bounty).assign(changes, { merge: true });
    this.getEntityManager().persist(updatedBounty);
    return updatedBounty;
  }
}
