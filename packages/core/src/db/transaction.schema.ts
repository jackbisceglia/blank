import { groupTable } from './group.schema';
import { Member, memberTable } from './member.schema';
import {
  DrizzleModelTypes,
  createTable,
  uuidv7,
  uuidv7WithDefault,
} from './utils';

import { relations, sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// sql
export const transactionTable = createTable('transaction', {
  id: uuidv7WithDefault('id').primaryKey(),
  groupId: uuidv7('group_id').notNull(),
  payerId: uuidv7('payer_id').notNull(),
  amount: integer('amount').notNull(),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`),
  description: text('description').notNull(),
});

export const transactionRelation = relations(
  transactionTable,
  ({ one, many }) => ({
    payees: many(payeeTable),
    group: one(groupTable, {
      fields: [transactionTable.groupId],
      references: [groupTable.id],
    }),
  }),
);

export const payeeTable = createTable('transaction_payee', {
  id: uuidv7WithDefault('id').primaryKey(),
  transactionId: uuidv7('transaction_id').notNull(),
  memberId: uuidv7('payee_id').notNull(),
});

export const payeeRelation = relations(payeeTable, ({ one }) => ({
  transaction: one(transactionTable, {
    fields: [payeeTable.transactionId],
    references: [transactionTable.id],
  }),
  member: one(memberTable, {
    fields: [payeeTable.memberId],
    references: [memberTable.id],
  }),
}));

// types
type TransactionTypes = DrizzleModelTypes<typeof transactionTable>;
type PayeeTypes = DrizzleModelTypes<typeof payeeTable>;

export type Transaction = TransactionTypes['Select'];
export type TransactionInsert = TransactionTypes['Insert'];
export type Payee = PayeeTypes['Select'];
export type PayeeInsert = PayeeTypes['Insert'];

export type PayeeWithMember = Payee & {
  member: Pick<Member, 'nickname' | 'userId'>;
};

export type TransactionInsertWithPayees = TransactionInsert & {
  payees: Omit<PayeeInsert, 'transactionId' | 'id'>[];
};
export type TransactionWithPayees = TransactionInsert & {
  payees: Payee[];
};

export type TransactionInsertWithPayeesWithMembers = TransactionInsert & {
  payees: PayeeWithMember[];
};
export type TransactionWithPayeesWithMembers = Transaction & {
  payees: PayeeWithMember[];
};

// runtime schemas
export const Transaction = createSelectSchema(transactionTable);
export const TransactionInsert = createInsertSchema(transactionTable);
export const Payee = createSelectSchema(payeeTable);
export const PayeeInsert = createInsertSchema(payeeTable);

export const PayeeWithMember = Payee.extend({
  member: Member.omit({ id: true }),
});

export const TransactionInsertWithPayees = TransactionInsert.extend({
  payees: PayeeInsert.omit({
    id: true,
    transactionId: true,
  }).array(),
});

export const TransactionWithPayees = Transaction.extend({
  payees: Payee.array(),
});

export const TransactionWithPayeesWithMembers = Transaction.extend({
  payees: PayeeWithMember.array(),
});
