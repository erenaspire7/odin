import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  DateTimeType,
} from "@mikro-orm/core";
import { Bounty } from "./bounty.entity";
import { User } from "./user.entity";
import { AgentRepository } from "@odin/core/db";

@Entity({ repository: () => AgentRepository })
export class Agent {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuid_generate_v1mc()" })
  agentId!: string;

  @ManyToOne(() => Bounty, { nullable: false, fieldName: "bountyId" })
  bounty: Bounty;

  @ManyToOne(() => User, { nullable: false, fieldName: "creatorId" })
  creator: User;

  @Property({ type: "string", nullable: false })
  webhookUrl: string;

  @Property({ type: "string", nullable: false })
  webhookSecret: string;

  @Property({ type: "boolean", nullable: false })
  validated: boolean = false;

  @Property({ type: DateTimeType, nullable: false })
  createdAt: Date = new Date();

  @Property({ type: DateTimeType, nullable: false, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: "decimal", nullable: true })
  stake?: number;

  @Property({ type: "string", nullable: true })
  filecoinCID?: string;

  constructor(
    bounty: Bounty,
    creator: User,
    webhookUrl: string,
    webhookSecret: string,
    validated: boolean,
    stake?: number,
    filecoinCID?: string,
  ) {
    this.bounty = bounty;
    this.creator = creator;
    this.webhookUrl = webhookUrl;
    this.webhookSecret = webhookSecret;
    this.validated = validated;
    this.stake = stake;
    this.filecoinCID = filecoinCID;
  }
}
