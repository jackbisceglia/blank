import { relations } from "drizzle-orm";
import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { expenseTable } from "./expense.schema";
import { memberTable } from "./member.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-valibot";
import { DrizzleModelTypes } from "./utils";

export const expenseMemberTable = pgTable(
  "expenseMember",
  {
    expenseId: uuid().notNull(), // update to make into ulid
    groupId: uuid().notNull(), // update to make into ulid
    userId: uuid().notNull(), // update to make into ulid
  },
  (table) => [
    primaryKey({ columns: [table.expenseId, table.groupId, table.userId] }),
  ]
);

export const expenseMemberRelation = relations(
  expenseMemberTable,
  ({ one }) => ({
    expense: one(expenseTable, {
      fields: [expenseMemberTable.expenseId],
      references: [expenseTable.id],
    }),
    member: one(memberTable, {
      fields: [expenseMemberTable.groupId, expenseMemberTable.userId],
      references: [memberTable.groupId, memberTable.userId],
    }),
  })
);

type ExpenseMemberTypes = DrizzleModelTypes<typeof expenseMemberTable>;

export type ExpenseMember = ExpenseMemberTypes["Select"];
export const ExpenseMember = createSelectSchema(expenseMemberTable);

export type ExpenseMemberInsert = ExpenseMemberTypes["Insert"];
export const ExpenseMemberInsert = createInsertSchema(expenseMemberTable);
