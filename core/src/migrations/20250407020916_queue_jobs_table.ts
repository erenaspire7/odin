import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await Promise.all([
    await knex.schema.withSchema("odin").createTable("queue_jobs", (table) => {
      table.uuid("id").notNullable().primary();
      table.string("type").notNullable();
      table.jsonb("payload").notNullable();
      table.string("status").notNullable();
      table.integer("priority").notNullable();
      table.integer("maxAttempts").notNullable();
      table.integer("attempts").notNullable();
      table.timestamp("lockedUntil").nullable();
      table.string("nextJobId").nullable();
      table.string("lastError").nullable();
      table.jsonb("result").nullable();
      table.timestamp("createdAt").defaultTo(knex.fn.now()).notNullable();
      table.timestamp("updatedAt").defaultTo(knex.fn.now()).notNullable();
    }),
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await Promise.all([
    await knex.schema.withSchema("odin").dropTable("queue_jobs"),
  ]);
}
