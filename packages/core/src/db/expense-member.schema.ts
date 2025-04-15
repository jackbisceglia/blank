import { relations, sql } from "drizzle-orm";
import {
  check,
  numeric,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { expenseTable } from "./expense.schema";
import { memberTable } from "./member.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-valibot";
import { DrizzleModelTypes } from "./utils";

export const expenseMemberTable = pgTable(
  "expenseMember",
  {
    expenseId: uuid().notNull(), // TODO: update to make into ulid
    groupId: uuid().notNull(), // TODO: update to make into ulid
    userId: uuid().notNull(), // TODO: update to make into ulid
    role: text({ enum: ["payer", "participant"] }).default("payer"),
    split: numeric({ precision: 3, scale: 2 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.expenseId, table.groupId, table.userId] }),
    check("split_check", sql`${table.split} >= 0 AND ${table.split} <= 1`),
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
