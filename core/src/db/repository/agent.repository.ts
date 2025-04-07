import { Agent, User, Bounty } from "@odin/core/db";
import { EntityRepository, wrap } from "@mikro-orm/postgresql";

export class AgentRepository extends EntityRepository<Agent> {
  async createAgent({
    creator,
    bounty,
    webhookUrl,
    webhookSecret,
  }: {
    creator: User;
    bounty: Bounty;
    webhookUrl: string;
    webhookSecret: string;
  }) {
    const agent = new Agent(bounty, creator, webhookUrl, webhookSecret, false);
    this.getEntityManager().persist(agent);
    return agent;
  }

  async getAgent(agentId: string) {
    return await this.findOne({ agentId });
  }

  async updateAgent(agent: Agent, changes: any) {
    const updatedAgent = wrap(agent).assign(changes, { merge: true });
    this.getEntityManager().persist(updatedAgent);
    return updatedAgent;
  }

  async getAgentByBounty(bountyId: string, walletAddress: string) {
    return await this.findOne({ bounty: { bountyId }, creator: { walletAddress } });
  }
}
