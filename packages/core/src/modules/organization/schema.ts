import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

export const organizationTable = pgTable("organization", {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  pattern: text().notNull(),
  plan: text({ enum: ["base", "pro"] })
    .notNull()
    .default("base"),
});

type OrganizationTypes = DrizzleModelTypes<typeof organizationTable>;

export type Organization = OrganizationTypes["Select"];
export const Organization = createSelectSchema(organizationTable);

export type OrganizationInsert = OrganizationTypes["Insert"];
export const OrganizationInsert = createInsertSchema(organizationTable);
