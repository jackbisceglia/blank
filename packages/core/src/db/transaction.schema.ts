import { groupTable } from './group.schema';
import { Member, memberTable } from './member.schema';
import {
  DrizzleModelTypes,
  createTable,
  uuidv7,
  uuidv7WithDefault,
} from './utils';

import { relations, sql } from 'drizzle-orm';
import {
  // doublePrecision,
  integer,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// sql
export const transactionTable = createTable('transaction', {
  id: uuidv7WithDefault().primaryKey(),
  groupId: uuidv7().notNull(),
  payerId: uuidv7().notNull(),
  amount: integer().notNull(),
  date: text().default(sql`(CURRENT_TIMESTAMP)`),
  description: text().notNull(),
});

export const transactionRelation = relations(
  transactionTable,
  ({ one, many }) => ({
    transactionMembers: many(transactionMemberTable),
    group: one(groupTable, {
      fields: [transactionTable.groupId],
      references: [groupTable.id],
    }),
  }),
);

export const transactionMemberTable = createTable(
  'transactionMember',
  {
    transactionId: uuidv7().notNull(),
    groupId: uuidv7().notNull(),
    userId: uuidv7().notNull(),
    // share: doublePrecision().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.transactionId, table.groupId, table.userId] }),
  ],
);

export const transactionMemberRelation = relations(
  transactionMemberTable,
  ({ one }) => ({
    transaction: one(transactionTable, {
      fields: [transactionMemberTable.transactionId],
      references: [transactionTable.id],
    }),
    member: one(memberTable, {
      fields: [transactionMemberTable.groupId, transactionMemberTable.userId],
      references: [memberTable.groupId, memberTable.userId],
    }),
  }),
);

// types
type TransactionTypes = DrizzleModelTypes<typeof transactionTable>;
type TransactionMemberTypes = DrizzleModelTypes<typeof transactionMemberTable>;

export type Transaction = TransactionTypes['Select'];
export type TransactionInsert = TransactionTypes['Insert'];
export type TransactionMember = TransactionMemberTypes['Select'];
export type TransactionMemberInsert = TransactionMemberTypes['Insert'];

export type TransactionMemberWithMember = TransactionMember & {
  member: Pick<Member, 'nickname' | 'userId'>;
};

export type TransactionInsertWithTransactionMembers = TransactionInsert & {
  transactionMembers: Omit<TransactionMemberInsert, 'transactionId' | 'id'>[];
};
export type TransactionWithTransactionMembers = TransactionInsert & {
  transactionMembers: TransactionMember[];
};

export type TransactionInsertWithTransactionMembersWithMembers =
  TransactionInsert & {
    transactionMembers: TransactionMemberWithMember[];
  };
export type TransactionWithTransactionMembersWithMembers = Transaction & {
  transactionMembers: TransactionMemberWithMember[];
};

export type TransactionWithMembersAsTransactionMembers = Transaction & {
  transactionMembers: Member[];
};

// runtime schemas
export const Transaction = createSelectSchema(transactionTable);
export const TransactionInsert = createInsertSchema(transactionTable);
export const TransactionMember = createSelectSchema(transactionMemberTable);
export const TransactionMemberInsert = createInsertSchema(
  transactionMemberTable,
);

export const TransactionInsertWithTransactionMembers = TransactionInsert.extend(
  {
    transactionMembers: TransactionMemberInsert.omit({
      transactionId: true,
    }).array(),
  },
);

export const TransactionWithTransactionMembers = Transaction.extend({
  transactionMembers: TransactionMember.array(),
});
