import {
  Entity,
  JsonType,
  PrimaryKey,
  Property,
  DateTimeType,
} from "@mikro-orm/core";
import { JobType, JobStatus } from "@odin/core/types";
import { QueueRepository } from "@odin/core/db";

@Entity({ tableName: "queue_jobs", repository: () => QueueRepository })
export class QueueJob {
  @PrimaryKey({ type: "uuid", defaultRaw: "uuid_generate_v1mc()" })
  id!: string;

  @Property({ type: "string", nullable: false })
  type: JobType;

  @Property({ type: JsonType, nullable: false })
  payload: any;

  @Property({ type: "string", nullable: false })
  status: JobStatus = JobStatus.PENDING;

  @Property({ type: "integer", nullable: false })
  priority: number = 0;

  @Property({ type: "integer", nullable: false })
  maxAttempts: number = 3;

  @Property({ type: "integer", nullable: false })
  attempts: number = 0;

  @Property({ type: DateTimeType, nullable: true })
  lockedUntil?: Date;

  @Property({ type: "string", nullable: true })
  nextJobId?: string;

  @Property({ type: DateTimeType, nullable: false })
  createdAt: Date = new Date();

  @Property({ type: DateTimeType, nullable: false, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: "string", nullable: true })
  lastError?: string;

  @Property({ type: JsonType, nullable: true })
  result?: any;

  constructor(
    type: JobType,
    payload: any,
    nextJobId?: string,
    priority: number = 0,
    maxAttempts: number = 3,
  ) {
    this.type = type;
    this.payload = payload;
    this.nextJobId = nextJobId;
    this.priority = priority;
    this.maxAttempts = maxAttempts;
  }
}
