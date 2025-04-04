import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await Promise.all([
    await knex.raw("CREATE SCHEMA IF NOT EXISTS odin"),
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'),
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await Promise.all([await knex.raw("DROP SCHEMA IF EXISTS odin")]);
}
