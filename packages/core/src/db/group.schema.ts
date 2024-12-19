import { memberTable } from './member.schema';
import {
  DrizzleModelTypes,
  createTable,
  uuidv7,
  uuidv7WithDefault,
} from './utils';

import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const groupTable = createTable('group', {
  id: uuidv7WithDefault('id').primaryKey(),
  title: text('title').notNull(),
  ownerId: uuidv7('owner_id').notNull(),
});

export const groupRelation = relations(groupTable, ({ many, one }) => ({
  members: many(memberTable),
  owner: one(memberTable, {
    fields: [groupTable.ownerId],
    references: [memberTable.userId],
  }),
}));

// types
type GroupTypes = DrizzleModelTypes<typeof groupTable>;

export type Group = GroupTypes['Select'];
export type GroupInsert = GroupTypes['Insert'];

// runtime schemas
export const Group = createSelectSchema(groupTable);
export const GroupInsert = createInsertSchema(groupTable);
