import { MikroORM, EntityCaseNamingStrategy } from "@mikro-orm/postgresql";

import { User, Bounty, Agent, Dataset, DeltaHash } from "./entity";

export async function initMikroORM() {
  const orm = await MikroORM.init({
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    entities: [User, Bounty, Agent, Dataset, DeltaHash],
    pool: {
      min: 2,
      max: 10,
    },
    schema: "odin",
    namingStrategy: EntityCaseNamingStrategy,
    discovery: { disableDynamicFileAccess: true },
  }); 

  return orm;
}
