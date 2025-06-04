import {
  check,
  numeric,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { expenseTable } from "../expense/schema";
import { memberTable } from "../member/schema";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { sql } from "drizzle-orm/sql";

export const participantTable = pgTable(
  "participant",
  {
    expenseId: uuid().notNull(), // TODO: update to make into ulid
    groupId: uuid().notNull(), // TODO: update to make into ulid
    userId: uuid().notNull(), // TODO: update to make into ulid
    role: text({ enum: ["payer", "participant"] }).default("payer"),
    split: numeric({ precision: 3, scale: 2 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.expenseId, table.userId] }),
    check("split_check", sql`${table.split} >= 0 AND ${table.split} <= 1`),
  ]
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
