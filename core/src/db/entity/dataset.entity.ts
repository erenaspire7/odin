import {
  Entity,
  PrimaryKey,
  Property,
  DateTimeType,
  Collection,
  OneToMany,
  JsonType,
} from "@mikro-orm/core";
import { DeltaHash } from "./deltaHash.entity";
import { DatasetRepository } from "@odin/core/db";

@Entity({ repository: () => DatasetRepository })
export class Dataset {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuid_generate_v1mc()" })
  datasetId!: string;

  @Property({ type: "string", nullable: false })
  name: string;

  @Property({ type: "string", nullable: true })
  description?: string;

  // fix
  @Property({ type: JsonType, nullable: false })
  schema: any;

  @Property({ type: DateTimeType, nullable: false })
  createdAt: Date = new Date();

  @Property({ type: DateTimeType, nullable: false, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => DeltaHash, (deltaHash) => deltaHash.dataset)
  deltaHashes = new Collection<DeltaHash>(this);

  constructor(name: string, schema: any, description?: string) {
    this.name = name;
    this.description = description;
    this.schema = schema;
  }
}
