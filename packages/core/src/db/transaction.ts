import { db } from '.';
import { TransactionParseable } from '../ai';
import { memberTable } from './member.schema';
import {
  Transaction,
  TransactionInsert,
  TransactionInsertWithPayees,
  payeeTable,
  transactionTable,
} from './transaction.schema';

import { and, desc, eq, inArray } from 'drizzle-orm';

// temp: replace with relation/join/query when users are set up
const findPayeeIdByName = async (name: string, userId: string) => {
  const contacts = await db.query.memberTable.findMany({
    columns: { nickname: true, id: true },
    where: eq(memberTable.userId, userId),
  });

  // more complex matching logic, otherwise delegate this to the db
  const match = contacts.find(
    ({ nickname: contactName }) =>
      contactName.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(contactName.toLowerCase()),
  );

  return match?.id ?? null;
};

// module for crud operations on transaction entity
export const transaction = {
  // crud
  create(_transaction: TransactionInsert) {
    const transaction = TransactionInsert.parse(_transaction);

    const inserted = db
      .insert(transactionTable)
      .values(transaction)
      .returning();

    return inserted;
  },
  createPayees(memberIds: string[], transactionId: string) {
    // TODO: check if we should add and() with payerId
    if (!memberIds.length) {
      return [];
    }

    const inserted = db
      .insert(payeeTable)
      .values(
        memberIds.map((memberId) => ({
          transactionId,
          memberId,
        })),
      )
      .returning();

    return inserted;
  },
  getAllByUserId(id: string) {
    return db.query.transactionTable.findMany({
      with: {
        payees: {
          with: {
            member: {
              columns: {
                nickname: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy: desc(transactionTable.date),
      where: eq(transactionTable.payerId, id),
    });
  },
  updateFields(id: string, userId: string, fields: Partial<Transaction>) {
    return db
      .update(transactionTable)
      .set(fields)
      .where(
        and(eq(transactionTable.id, id), eq(transactionTable.payerId, userId)),
      );
  },
  deleteById(id: string, userId: string) {
    return db
      .delete(transactionTable)
      .where(
        and(eq(transactionTable.id, id), eq(transactionTable.payerId, userId)),
      )
      .returning();
  },
  deleteByIds(ids: string[], userId: string) {
    return db
      .delete(transactionTable)
      .where(
        and(
          inArray(transactionTable.id, ids),
          eq(transactionTable.payerId, userId),
        ),
      )
      .returning();
  },
  deleteAll(userId: string) {
    return db
      .delete(transactionTable)
      .where(eq(transactionTable.payerId, userId));
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
      payees: payeeIds.map((id) => ({ memberId: id })),
    };
  },
};
