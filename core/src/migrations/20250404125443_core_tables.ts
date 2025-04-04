import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await Promise.all([
    await knex.schema.withSchema("odin").createTable("User", (table) => {
      table.uuid("userId").notNullable().primary();
      table.string("walletAddress").notNullable().unique();
      table.string("name").nullable();
      table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());
    }),
    await knex.schema.withSchema("odin").createTable("Bounty", (table) => {
      table.uuid("bountyId").notNullable().primary();

      // creator can't make agents for deployed bounty
      table
        .uuid("creatorId")
        .notNullable()
        .references("userId")
        .inTable("odin.User");
      table.string("name").notNullable();
      table.text("description").notNullable();
      table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());
      table.timestamp("expiresAt").notNullable();
      table.jsonb("expectedOutput").notNullable();
      table.jsonb("prize").notNullable();

      // type - sponsored / community
      table.string("type").notNullable();

      // draft, active, completed, cancelled
      table.string("status").notNullable();
    }),

    await knex.schema.withSchema("odin").createTable("Agent", (table) => {
      table.uuid("agentId").notNullable().primary();
      table
        .uuid("bountyId")
        .notNullable()
        .references("bountyId")
        .inTable("odin.Bounty");
      table
        .uuid("creatorId")
        .notNullable()
        .references("userId")
        .inTable("odin.User");
      table.string("webhookUrl").notNullable();
      table.string("webhookSecret").notNullable();
      table.boolean("validated").notNullable().defaultTo(false);
      table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());

      // if community, each agent stakes a certain amount
      table.decimal("stake", 10, 18).nullable();

      // cid for stored response
      table.string("filecoinCID").nullable();
    }),
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await Promise.all([
    await knex.schema.withSchema("odin").dropTable("Agent"),
    await knex.schema.withSchema("odin").dropTable("Bounty"),
    await knex.schema.withSchema("odin").dropTable("User"),
  ]);
}
