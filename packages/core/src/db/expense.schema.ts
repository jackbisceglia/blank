import { groupTable } from "./group.schema";
import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { expenseMemberTable } from "./expense-member.schema";
import { DrizzleModelTypes } from "./utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

export const expenseTable = pgTable("expense", {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(), // update to make into ulid
  groupId: uuid().notNull(), // update to make into ulid
  payerId: uuid().notNull(), // update to make into ulid
  amount: integer().notNull(),
  date: text().default(sql`(CURRENT_TIMESTAMP)`),
  description: text().notNull(),
});

export const expenseRelation = relations(expenseTable, ({ one, many }) => ({
  expenseMembers: many(expenseMemberTable),
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
