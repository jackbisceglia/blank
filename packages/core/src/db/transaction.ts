import { db } from '.';
import { TransactionParseable } from '../ai';
import { constants } from '../ai/core';
import {
  payeeTable,
  TransactionInsert,
  TransactionInsertWithPayees,
  transactionTable,
} from './transaction.schema';

import { desc, eq } from 'drizzle-orm';

// temp: replace with relation/join/query when users are set up
const findPayeeIdByName = (name: string) => {
  const mappings = [
    [constants.sender, '0192ad02-c996-7060-adf5-9682a7dfe743'],
    ['Jane Doe', '0192ace3-1ca8-72eb-8ab2-b6b0ecc4198b'],
    ['John Doe', '0192ace3-c659-780d-9d6f-b5f6c74651b7'],
  ];

  for (const [payeeName, payeeId] of mappings) {
    if (
      payeeName.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(payeeName.toLowerCase())
    ) {
      return payeeId;
    }
  }

  return null;
};

export const generateRandom = (): TransactionInsert => ({
  amount: Math.floor(Math.random() * 100),
  description: Math.random().toString(36).substring(7),
  payerId: Math.random().toString(36).substring(7),
  date: new Date().toISOString(),
});

// module for crud operations on transaction entity
export const transaction = {
  // crud
  getAll() {
    return db.query.transactionTable.findMany({
      with: {
        payees: true,
      },
      orderBy: desc(transactionTable.date),
    });
  },
  deleteById(id: string) {
    return db
      .delete(transactionTable)
      .where(eq(transactionTable.id, id))
      .returning();
  },
  deleteAll() {
    return db.delete(transactionTable);
  },
  create(_transaction: TransactionInsert) {
    const transaction = TransactionInsert.parse(_transaction);

    const inserted = db
      .insert(transactionTable)
      .values(transaction)
      .returning();

    return inserted;
  },
  createPayees(payeeIds: { payeeId: string }[], transactionId: string) {
    if (!payeeIds.length) {
      return [];
    }

    const inserted = db
      .insert(payeeTable)
      .values(payeeIds.map((obj) => ({ ...obj, transactionId })))
      .returning();

    return inserted;
  },
  transformParsedToInsertable(
    parsed: TransactionParseable,
    userId: string,
  ): TransactionInsertWithPayees {
    const payeeId = userId;
    // get user ids from name using core module
    // we can do like getIdNearestToName(name) to get the closest match
    // could potentially use an llm to try and find the closest match
    const payeeIds = parsed.payees
      .map((payee) => findPayeeIdByName(payee.payeeName) ?? null)
      .filter((id) => id !== null);

    if (!payeeId || payeeIds.length !== parsed.payees.length) {
      throw new Error('Could not find payeeId for payer or payee');
    }
    return {
      ...parsed,
      payerId: payeeId,
      payees: payeeIds.map((id) => ({ payeeId: id })),
    };
  },
};
