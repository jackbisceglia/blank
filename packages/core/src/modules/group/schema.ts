import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { memberTable } from "../member/schema";
import { inviteTable } from "../invite/schema";

export const groupTable = pgTable("group", {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(), // update to make into ulid
  title: text().notNull().unique(),
  slug: text().notNull(),
  description: text().notNull(),
  ownerId: uuid().notNull(), // update to make into ulid
  invitationId: uuid(), // update to make into ulid
  createdAt: timestamp().defaultNow().notNull(),
});

export const groupRelation = relations(groupTable, ({ many, one }) => ({
  members: many(memberTable),
  invites: many(inviteTable),
  owner: one(memberTable, {
    fields: [groupTable.ownerId],
    references: [memberTable.userId],
  }),
}));

type GroupTypes = DrizzleModelTypes<typeof groupTable>;

export type Group = GroupTypes["Select"];
export const Group = createSelectSchema(groupTable);

export type GroupInsert = GroupTypes["Insert"];
export const GroupInsert = createInsertSchema(groupTable);
