import { Dataset, DeltaHash } from "@odin/core/db";
import { EntityRepository, wrap } from "@mikro-orm/core";

export class DeltaHashRepository extends EntityRepository<DeltaHash> {
  async retrieveLatestHash(datasetId: string) {
    return await this.findOne(
      {
        dataset: { datasetId },
      },
      {
        orderBy: {
          timestamp: "DESC",
        },
      },
    );
  }

  async log(input: {
    dataset: Dataset;
    hash: string;
    timestamp: Date;
    version: number;
    totalRecords: number;
  }) {
    const { dataset, hash, timestamp, version, totalRecords } = input;
    const deltaHash = new DeltaHash(
      dataset,
      hash,
      timestamp,
      version,
      totalRecords,
    );
    await this.getEntityManager().persistAndFlush(deltaHash);

    return deltaHash;
  }
}
