import { pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { groupTable } from "../group/schema";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { relations } from "drizzle-orm/relations";

export const memberTable = pgTable(
  "member",
  {
    groupId: uuid().notNull(), // update to make into ulid
    userId: uuid().notNull(), // update to make into ulid
    nickname: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const memberRelation = relations(memberTable, ({ one }) => ({
  group: one(groupTable, {
    fields: [memberTable.groupId],
    references: [groupTable.id],
  }),
}));

type MemberTypes = DrizzleModelTypes<typeof memberTable>;

export type Member = MemberTypes["Select"];
export const Member = createSelectSchema(memberTable);

export type MemberInsert = MemberTypes["Insert"];
export const MemberInsert = createInsertSchema(memberTable);
