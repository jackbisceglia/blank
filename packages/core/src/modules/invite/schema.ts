import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { groupTable } from "../group/schema";

export const inviteTable = pgTable("invite", {
  token: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  groupId: uuid().notNull(),
  status: text()
    .$type<"pending" | "accepted" | "expired">()
    .notNull()
    .default("pending"),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  acceptedAt: timestamp(),
});

export const inviteRelation = relations(inviteTable, ({ one }) => ({
  group: one(groupTable, {
    fields: [inviteTable.groupId],
    references: [groupTable.id],
  }),
}));

type InviteTypes = DrizzleModelTypes<typeof inviteTable>;

export type Invite = InviteTypes["Select"];
export const Invite = createSelectSchema(inviteTable);

export type InviteInsert = InviteTypes["Insert"];
export const InviteInsert = createInsertSchema(inviteTable);

