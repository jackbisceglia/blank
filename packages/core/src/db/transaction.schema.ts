import { DrizzleModelTypes, createTable, uuidv7 } from "./utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, text } from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

export const transactionTable = createTable("transaction", {
  id: uuidv7("id").primaryKey(),
  payeeId: text("payee_id").notNull(),
  payerId: text("payer_id").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").default(sql`(CURRENT_TIMESTAMP)`),
  description: text("description").notNull(),
});

type TransactionTypes = DrizzleModelTypes<typeof transactionTable>;

export type Transaction = TransactionTypes["Select"];
export type TransactionInsert = TransactionTypes["Insert"];

export const Transaction = createSelectSchema(transactionTable);
export const TransactionInsert = createInsertSchema(transactionTable);
