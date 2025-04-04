import { MikroORM } from "@mikro-orm/postgresql";

import { User, Bounty, Agent } from "./entity";

export async function initMikroORM() {
  const orm = await MikroORM.init({
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    entities: [User, Bounty, Agent],
    pool: {
      min: 2,
      max: 10,
    },
  });

  return orm;
}
