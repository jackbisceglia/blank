import { groupTable } from './group.schema';
import { DrizzleModelTypes, createTable, uuidv7 } from './utils';

import { relations } from 'drizzle-orm';
import { primaryKey, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const memberTable = createTable(
  'member',
  {
    groupId: uuidv7().notNull(),
    userId: uuidv7().notNull(),
    nickname: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const memberRelation = relations(memberTable, ({ one }) => ({
  group: one(groupTable, {
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
