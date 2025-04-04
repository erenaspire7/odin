import { Entity, PrimaryKey, Property, DateTimeType } from "@mikro-orm/core";
import { UserRepository } from "./../repository";

@Entity({ repository: () => UserRepository })
export class User {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuid_generate_v1mc()" })
  userId!: string;

  @Property({ type: "string", nullable: false })
  walletAddress: string;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: DateTimeType, nullable: false })
  createdAt: Date = new Date();

  @Property({ type: DateTimeType, nullable: false, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(walletAddress: string, name?: string) {
    this.walletAddress = walletAddress;
    this.name = name;
  }
}
