import { db } from '.';
import { TransactionParseable } from '../ai';
import { memberTable } from './member.schema';
import {
  Transaction,
  TransactionInsert,
  TransactionInsertWithTransactionMembers,
  transactionMemberTable,
  transactionTable,
} from './transaction.schema';

import { and, desc, eq, inArray, not } from 'drizzle-orm';

// temp: replace with relation/join/query when users are set up
const findMemberIdByName = async (
  userId: string,
  name: string,
  groupId: string,
) => {
  const members = await db.query.memberTable.findMany({
    columns: { nickname: true, groupId: true, userId: true },
    where: and(
      not(eq(memberTable.userId, userId)),
      eq(memberTable.groupId, groupId),
    ),
  });

  console.log('groupId in fuzzy finding: ', groupId);

  // TODO: more complex matching logic, otherwise delegate this to the db. probably want to score based on match similarity
  const fuzzyMatch = (nickname: string, name: string) =>
    nickname.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(nickname.toLowerCase());

  const match = members.find(
    (m) => m.userId !== userId && fuzzyMatch(m.nickname, name),
  );

  return match
    ? {
        groupId: match.groupId,
        userId: match.userId,
      }
    : null;
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
  createTransactionMembers(
    memberUserIds: string[],
    groupId: string,
    transactionId: string,
  ) {
    // TODO: check if we should add and() with payerId
    if (!memberUserIds.length) {
      return [];
    }

    const inserted = db
      .insert(transactionMemberTable)
      .values(
        memberUserIds.map((userId) => ({
          userId: userId,
          groupId: groupId,
          transactionId: transactionId,
          // share: 0.5,
        })),
      )
      .returning();

    return inserted;
  },
  getAllByUserId(id: string) {
    return db.query.transactionTable.findMany({
      with: {
        transactionMembers: {
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
  deleteById(id: string) {
    return db
      .delete(transactionTable)
      .where(and(eq(transactionTable.id, id)))
      .returning();
  },
  deleteByIds(ids: string[]) {
    return db
      .delete(transactionTable)
      .where(and(inArray(transactionTable.id, ids)))
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
    groupId: string,
  ): Promise<TransactionInsertWithTransactionMembers> {
    const payerId = userId;
    // get user ids from name using core module
    // we can do like getIdNearestToName(name) to get the closest match
    // could potentially use an llm to try and find the closest match
    const transactionMembers = (
      await Promise.all(
        parsed.transactionMembers.map(
          async (joined) =>
            await findMemberIdByName(
              userId,
              joined.transactionMemberName,
              groupId,
            ),
        ),
      )
    ).filter((id) => id !== null);

    if (
      !payerId ||
      transactionMembers.length !== parsed.transactionMembers.length
    ) {
      throw new Error(
        `Could not find payeeId for payer or payee, payees: ${JSON.stringify(parsed.transactionMembers)}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { payerName: _, ...rest } = parsed;

    return {
      ...rest,
      payerId,
      groupId,
      transactionMembers,
    };
  },
};
