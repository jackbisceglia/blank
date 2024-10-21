import { DrizzleModelTypes, createTable, uuidv7 } from "./utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, text } from "drizzle-orm/pg-core";

import { relations, sql } from "drizzle-orm";

// sql
export const transactionTable = createTable("transaction", {
  id: uuidv7("id").primaryKey(),
  payerId: text("payer_id").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").default(sql`(CURRENT_TIMESTAMP)`),
  description: text("description").notNull(),
});

export const transactionRelation = relations(transactionTable, ({ many }) => ({
  payees: many(payeeTable),
}));

export const payeeTable = createTable("transaction_payee", {
  id: uuidv7("id").primaryKey(),
  transactionId: uuidv7("transaction_id").notNull(),
  payeeId: uuidv7("payee_id").notNull(),
});

export const payeeRelation = relations(payeeTable, ({ one }) => ({
  transaction: one(transactionTable, {
    fields: [payeeTable.transactionId],
    references: [transactionTable.id],
  }),
}));

// types
type TransactionTypes = DrizzleModelTypes<typeof transactionTable>;
type PayeeTypes = DrizzleModelTypes<typeof payeeTable>;

export type Transaction = TransactionTypes["Select"];
export type TransactionInsert = TransactionTypes["Insert"];
export type Payee = PayeeTypes["Select"];
export type PayeeInsert = PayeeTypes["Insert"];

export type TransactionInsertWithPayees = TransactionInsert & {
  payees: PayeeInsert[];
};

// runtime schemas
export const Transaction = createSelectSchema(transactionTable);
export const TransactionInsert = createInsertSchema(transactionTable);
export const Payee = createSelectSchema(payeeTable);
export const PayeeInsert = createInsertSchema(payeeTable);
