import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  DateTimeType,
} from "@mikro-orm/core";
import { Dataset } from "./dataset.entity";
import { DeltaHashRepository } from "@odin/core/db";

@Entity({ repository: () => DeltaHashRepository })
export class DeltaHash {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuid_generate_v1mc()" })
  id!: string;

  @ManyToOne(() => Dataset, { nullable: false, fieldName: "datasetId" })
  dataset: Dataset;

  @Property({ type: "string", nullable: false })
  hash: string;

  @Property({ type: DateTimeType, nullable: false })
  timestamp: Date;

  @Property({ type: "number", nullable: false })
  version: number;

  @Property({ type: "integer", nullable: false })
  totalRecords: number;

  constructor(
    dataset: Dataset,
    hash: string,
    timestamp: Date,
    version: number,
    totalRecords: number,
  ) {
    this.dataset = dataset;
    this.hash = hash;
    this.timestamp = timestamp;
    this.version = version;
    this.totalRecords = totalRecords;
  }
}
