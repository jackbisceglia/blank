import { payeeTable } from './transaction.schema';
import {
  createTable,
  DrizzleModelTypes,
  uuidv7,
  uuidv7WithDefault,
} from './utils';

import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const contactTable = createTable('contact', {
  id: uuidv7WithDefault('id').primaryKey(),
  userId: uuidv7('user_id').notNull(),
  // ^^ this is a clerk id (me) ^^
  phone: text('phone').notNull(),
  name: text('name').notNull(),
});

export const contactRelation = relations(contactTable, ({ many }) => ({
  payees: many(payeeTable),
}));

// types
type ContactTypes = DrizzleModelTypes<typeof contactTable>;

export type Contact = ContactTypes['Select'];
export type ContactInsert = ContactTypes['Insert'];

// runtime schemas
export const Contact = createSelectSchema(contactTable);
export const ContactInsert = createInsertSchema(contactTable);
