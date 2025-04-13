import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await Promise.all([
    // Create Dataset table
    await knex.schema.createTable("Dataset", (table) => {
      table.uuid("datasetId").primary();
      table.string("name").notNullable();
      table.text("description").nullable();
      table.jsonb("schema").notNullable();
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    }),
    // Create DeltaHash table
    await knex.schema.createTable("DeltaHash", (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v1mc()"));
      table
        .uuid("datasetId")
        .notNullable()
        .references("datasetId")
        .inTable("odin.Dataset");
      table.string("hash").notNullable();
      table.timestamp("timestamp").notNullable();
      table.integer("version").notNullable();

      // Optional: Add a composite index on dataset_id and version
      table.unique(["dataset_id", "version"]);
    }),
  ]);
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.dropTableIfExists("delta_hash");
  await knex.schema.dropTableIfExists("dataset");
}
