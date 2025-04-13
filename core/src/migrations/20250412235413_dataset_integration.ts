import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await Promise.all([
    // Create Dataset table
    await knex.schema.withSchema("odin").createTable("Dataset", (table) => {
      table
        .uuid("datasetId")
        .notNullable()
        .primary()
        .defaultTo(knex.raw("uuid_generate_v1mc()"));
      table.string("name").notNullable();
      table.text("description").nullable();
      table.jsonb("schema").notNullable();
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    }),
    // Create DeltaHash table
    await knex.schema.withSchema("odin").createTable("DeltaHash", (table) => {
      table
        .uuid("id")
        .notNullable()
        .primary()
        .defaultTo(knex.raw("uuid_generate_v1mc()"));
      table
        .uuid("datasetId")
        .notNullable()
        .references("datasetId")
        .inTable("odin.Dataset");
      table.string("hash").notNullable();
      table.timestamp("timestamp").notNullable();
      table.integer("version").notNullable();

      // Optional: Add a composite index on dataset_id and version
      // table.unique(["dataset_id", "version"]);
    }),
  ]);
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.withSchema("odin").dropTable("DeltaHash");
  await knex.schema.withSchema("odin").dropTable("Dataset");
}
