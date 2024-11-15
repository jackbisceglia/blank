import { contactTable, db } from '.';
import { TransactionParseable } from '../ai';
import {
  payeeTable,
  TransactionInsert,
  TransactionInsertWithPayees,
  transactionTable,
} from './transaction.schema';

import { desc, eq, inArray } from 'drizzle-orm';

// temp: replace with relation/join/query when users are set up
const findPayeeIdByName = async (name: string, userId: string) => {
  const contacts = await db.query.contactTable.findMany({
    columns: { name: true, id: true },
    where: eq(contactTable.userId, userId),
  });

  // more complex matching logic, otherwise delegate this to the db
  const match = contacts.find(
    ({ name: contactName }) =>
      contactName.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(contactName.toLowerCase()),
  );

  return match?.id ?? null;
};

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
  getAllByUserId(id: string) {
    return db.query.transactionTable.findMany({
      with: {
        payees: {
          with: {
            contact: {
              columns: {
                name: true,
                id: true,
              },
            },
          },
          columns: {},
        },
      },
      orderBy: desc(transactionTable.date),
      where: eq(transactionTable.payerId, id),
    });
  },
  deleteById(id: string) {
    return db
      .delete(transactionTable)
      .where(eq(transactionTable.id, id))
      .returning();
  },
  deleteByIds(ids: string[]) {
    return db
      .delete(transactionTable)
      .where(inArray(transactionTable.id, ids))
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
  async transformParsedToInsertable(
    parsed: TransactionParseable,
    userId: string,
  ): Promise<TransactionInsertWithPayees> {
    const payeeId = userId;
    // get user ids from name using core module
    // we can do like getIdNearestToName(name) to get the closest match
    // could potentially use an llm to try and find the closest match
    const payeeIds = (
      await Promise.all(
        parsed.payees.map(
          async (payee) => await findPayeeIdByName(payee.payeeName, userId),
        ),
      )
    ).filter((id) => id !== null);

    if (!payeeId || payeeIds.length !== parsed.payees.length) {
      throw new Error(
        `Could not find payeeId for payer or payee, payees: ${JSON.stringify(parsed.payees)}`,
      );
    }
    return {
      ...parsed,
      payerId: payeeId,
      payees: payeeIds.map((id) => ({ payeeId: id })),
    };
  },
};
