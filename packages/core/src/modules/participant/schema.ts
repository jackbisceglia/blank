import { json, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { expenseTable } from "../expense/schema";
import { memberTable } from "../member/schema";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

export const participantTable = pgTable(
  "participant",
  {
    expenseId: uuid().notNull(), // TODO: update to make into ulid
    groupId: uuid().notNull(), // TODO: update to make into ulid
    userId: uuid().notNull(), // TODO: update to make into ulid
    role: text({ enum: ["payer", "participant"] }).default("payer"),
    split: json().$type<[number, number]>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.expenseId, table.userId] })]
);

export const participantRelation = relations(participantTable, ({ one }) => ({
  expense: one(expenseTable, {
    fields: [participantTable.expenseId],
    references: [expenseTable.id],
    relationName: "expense",
  }),
  member: one(memberTable, {
    fields: [participantTable.groupId, participantTable.userId],
    references: [memberTable.groupId, memberTable.userId],
    relationName: "member",
  }),
}));

type ParticipantTypes = DrizzleModelTypes<typeof participantTable>;

export type Participant = ParticipantTypes["Select"];
export const Participant = createSelectSchema(participantTable);

export type ParticipantInsert = ParticipantTypes["Insert"];
export const ParticipantInsert = createInsertSchema(participantTable);
