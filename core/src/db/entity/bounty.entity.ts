import {
  JsonType,
  DateTimeType,
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
} from "@mikro-orm/core";
import { User } from "./user.entity";

@Entity()
export class Bounty {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuid_generate_v1mc()" })
  bountyId!: string;

  @Property({ type: "string", nullable: false })
  name: string;

  @Property({ type: "string", nullable: false })
  description: string;

  @ManyToOne(() => User, { nullable: false, fieldName: "creatorId" })
  creator: User;

  @Property({ type: DateTimeType, nullable: false })
  createdAt: Date = new Date();

  @Property({ type: DateTimeType, nullable: false, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: DateTimeType, nullable: false })
  expiresAt: Date;

  @Property({ type: JsonType, nullable: false })
  expectedOutput: any; // define type

  @Property({ type: JsonType, nullable: false })
  prize: any; // define type

  @Property({ type: "string", nullable: false })
  type: string; // custom enum

  @Property({ type: "string", nullable: false })
  status: string; // custom enum

  constructor(
    name: string,
    description: string,
    creator: User,
    expiresAt: Date,
    expectedOutput: any,
    prize: any,
    type: string,
    status: string,
  ) {
    this.name = name;
    this.description = description;
    this.creator = creator;
    this.expiresAt = expiresAt;
    this.expectedOutput = expectedOutput;
    this.prize = prize;
    this.type = type;
    this.status = status;
  }
}
