import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await Promise.all([
    knex.schema.withSchema("odin").alterTable("Bounty", (table) => {
      table.string("difficulty").notNullable().defaultTo("Easy");
      table.jsonb("tags").notNullable();
    }),
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await Promise.all([
    knex.schema.withSchema("odin").alterTable("Bounty", (table) => {
      table.dropColumn("difficulty");
      table.dropColumn("tags");
    }),
  ]);
}
