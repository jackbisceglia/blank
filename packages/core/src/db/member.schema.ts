import { groupTable } from './group.schema';
import {
  DrizzleModelTypes,
  createTable,
  uuidv7,
  uuidv7WithDefault,
} from './utils';

import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const memberTable = createTable('member', {
  id: uuidv7WithDefault('id').primaryKey(),
  groupId: uuidv7('group_id').notNull(),
  userId: uuidv7('user_id').notNull(),
  nickname: text('name').notNull(),
});

export const memberRelation = relations(memberTable, ({ one }) => ({
  members: one(groupTable, {
    fields: [memberTable.groupId],
    references: [groupTable.id],
  }),
}));

// types
type MemberTypes = DrizzleModelTypes<typeof memberTable>;

export type Member = MemberTypes['Select'];
export type MemberInsert = MemberTypes['Insert'];

// runtime schemas
export const Member = createSelectSchema(memberTable);
export const MemberInsert = createInsertSchema(memberTable);
