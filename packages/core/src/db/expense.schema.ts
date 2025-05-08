import { groupTable } from "./group.schema";
import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { participantTable } from "./participant.schema";
import { DrizzleModelTypes } from "./utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

export const expenseTable = pgTable("expense", {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(), // update to make into ulid
  groupId: uuid().notNull(), // update to make into ulid
  amount: integer().notNull(),
  date: timestamp().notNull().defaultNow(),
  description: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const expenseRelation = relations(expenseTable, ({ one, many }) => ({
  participants: many(participantTable),
  group: one(groupTable, {
    fields: [expenseTable.groupId],
    references: [groupTable.id],
  }),
}));

type ExpenseTypes = DrizzleModelTypes<typeof expenseTable>;

export type Expense = ExpenseTypes["Select"];
export const Expense = createSelectSchema(expenseTable);

export type ExpenseInsert = ExpenseTypes["Insert"];
export const ExpenseInsert = createInsertSchema(expenseTable);
