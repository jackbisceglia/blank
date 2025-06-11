import { pgTable, uuid, integer, timestamp, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { sql } from "drizzle-orm/sql";
import { participantTable } from "../participant/schema";
import { groupTable } from "../group/schema";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

export const expenseTable = pgTable("expense", {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(), // update to make into ulid
  groupId: uuid().notNull(), // update to make into ulid
  amount: integer().notNull(),
  date: timestamp().defaultNow().notNull(),
  description: text().notNull(),
  status: text({ enum: ["active", "settled"] })
    .default("active")
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
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
