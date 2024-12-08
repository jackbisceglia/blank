import { Contact, contactTable } from './contact.schema';
import {
  createTable,
  DrizzleModelTypes,
  uuidv7,
  uuidv7WithDefault,
} from './utils';

import { relations, sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// sql
export const transactionTable = createTable('transaction', {
  id: uuidv7WithDefault('id').primaryKey(),
  payerId: uuidv7('payer_id').notNull(),
  amount: integer('amount').notNull(),
  date: text('date').default(sql`(CURRENT_TIMESTAMP)`),
  description: text('description').notNull(),
});

export const transactionRelation = relations(transactionTable, ({ many }) => ({
  payees: many(payeeTable),
}));

export const payeeTable = createTable('transaction_payee', {
  id: uuidv7WithDefault('id').primaryKey(),
  transactionId: uuidv7('transaction_id').notNull(),
  payeeId: uuidv7('payee_id').notNull(),
});

export const payeeRelation = relations(payeeTable, ({ one }) => ({
  transaction: one(transactionTable, {
    fields: [payeeTable.transactionId],
    references: [transactionTable.id],
  }),
  contact: one(contactTable, {
    fields: [payeeTable.payeeId],
    references: [contactTable.id],
  }),
}));

// types
type TransactionTypes = DrizzleModelTypes<typeof transactionTable>;
type PayeeTypes = DrizzleModelTypes<typeof payeeTable>;

export type Transaction = TransactionTypes['Select'];
export type TransactionInsert = TransactionTypes['Insert'];
export type Payee = PayeeTypes['Select'];
export type PayeeInsert = PayeeTypes['Insert'];

export type TransactionInsertWithPayees = TransactionInsert & {
  payees: Omit<PayeeInsert, 'transactionId' | 'id'>[];
};
export type TransactionWithPayees = TransactionInsert & {
  payees: Payee[];
};
export type TransactionWithPayeesWithContacts = TransactionInsert & {
  payees: {
    contact: Pick<Contact, 'name' | 'id'>;
  }[];
};

// runtime schemas
export const Transaction = createSelectSchema(transactionTable);
export const TransactionInsert = createInsertSchema(transactionTable);
export const Payee = createSelectSchema(payeeTable);
export const PayeeInsert = createInsertSchema(payeeTable);

export const TransactionInsertWithPayees = TransactionInsert.extend({
  payees: PayeeInsert.omit({
    id: true,
    transactionId: true,
  }).array(),
});

export const TransactionWithPayees = TransactionInsert.extend({
  payees: Payee.array(),
});
