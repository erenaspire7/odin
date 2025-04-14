import { Dataset } from "@odin/core/db";
import { EntityRepository, wrap } from "@mikro-orm/postgresql";

export class DatasetRepository extends EntityRepository<Dataset> {
  async getDataset(datasetId: string) {
    return await this.findOne({ datasetId });
  }

  async createDataset(input: any) {
    const { name, schema, description } = input;

    const entry = new Dataset(name, schema, description);
    await this.getEntityManager().persistAndFlush(entry);

    return entry;
  }
}
