import {
  TransactionInsert,
  TransactionInsertZod,
  transactionSQL,
} from "./transactions.schema";

import { db } from ".";
import { toEnum } from "./utils";

export function getAll() {
  return db().select().from(transactionSQL);
}

export function create(_transaction: TransactionInsert) {
  const transaction = TransactionInsertZod.parse(_transaction);

  const inserted = db().insert(transactionSQL).values(transaction).returning();

  return inserted;
}

export function createRandom() {
  const transaction: TransactionInsert = {
    amount: Math.floor(Math.random() * 100),
    description: "test",
    payeeId: "test",
    payerId: "test",
    date: new Date().toISOString(),
    categories: toEnum(["food", "groceries"]),
  };

  return create(transaction);
}
