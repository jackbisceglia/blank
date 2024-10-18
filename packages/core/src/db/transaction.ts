import { TransactionInsert, transactionTable } from "./transaction.schema";

import { db } from ".";
import { desc } from "drizzle-orm";

export const generateRandom = (): TransactionInsert => ({
  amount: Math.floor(Math.random() * 100),
  description: Math.random().toString(36).substring(7),
  payeeId: Math.random().toString(36).substring(7),
  payerId: Math.random().toString(36).substring(7),
  date: new Date().toISOString(),
});

// module for crud operations on transaction entity
export module transaction {
  export function getAll() {
    return db
      .select()
      .from(transactionTable)
      .orderBy(desc(transactionTable.date));
  }

  export function deleteAll() {
    return db.delete(transactionTable);
  }

  export function create(_transaction: TransactionInsert) {
    const transaction = TransactionInsert.parse(_transaction);

    const inserted = db
      .insert(transactionTable)
      .values(transaction)
      .returning();

    return inserted;
  }

  export function createRandom() {
    return create(generateRandom());
  }
}
