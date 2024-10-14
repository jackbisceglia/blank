import { DrizzleModelTypes, Show, table, uuidv7 } from "./utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, text } from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

// no enums in sqlite, gonna just to comma separated strings for categories
export const transactionSQL = table("transactions", {
  id: uuidv7("id").primaryKey(),
  payeeId: text("payee_id").notNull(),
  payerId: text("payer_id").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").default(sql`(CURRENT_TIMESTAMP)`),
  description: text("description").notNull(),
  categories: text("").default(""),
});

type TransactionTypes = DrizzleModelTypes<typeof transactionSQL>;

export type Transaction = TransactionTypes["Select"];
export type TransactionInsert = TransactionTypes["Insert"];

export const TransactionZod = createSelectSchema(transactionSQL);
export const TransactionInsertZod = createInsertSchema(transactionSQL);
