import { DeltaHash } from "@odin/core/db";
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
  
  async log({}) {
    
  }
}
