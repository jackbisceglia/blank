import {
  ANYONE_CAN_DO_ANYTHING,
  createSchema,
  definePermissions,
  enumeration,
  number,
  PermissionsConfig,
  relationships,
  Row,
  string,
  table,
} from "@rocicorp/zero";

type AuthData = {
  sub: string;
};

// tables
const preference = table("preference")
  .columns({
    userId: string(),
    defaultGroupId: string(),
  })
  .primaryKey("userId", "defaultGroupId");

const expense = table("expense")
  .columns({
    id: string(),
    groupId: string(),
    amount: number(),
    date: string(),
    description: string(),
    createdAt: number().optional(),
  })
  .primaryKey("id");

const group = table("group")
  .columns({
    id: string(),
    title: string(),
    slug: string(),
    description: string(),
    ownerId: string(),
    invitationId: string().optional(),
    createdAt: number().optional(),
  })
  .primaryKey("id");

const member = table("member")
  .columns({
    groupId: string(),
    userId: string(),
    nickname: string(),
  })
  .primaryKey("groupId", "userId");

const expenseMember = table("expenseMember")
  .columns({
    expenseId: string(),
    groupId: string(),
    userId: string(),
    role: enumeration<"payer" | "participant">(),
    split: number(),
  })
  .primaryKey("expenseId", "groupId", "userId");

// relationships
const groupRelationships = relationships(group, ({ one, many }) => ({
  expenses: many({
    sourceField: ["id"],
    destSchema: expense,
    destField: ["groupId"],
  }),
  members: many({
    sourceField: ["id"],
    destSchema: member,
    destField: ["groupId"],
  }),
  owner: one({
    sourceField: ["id", "ownerId"],
    destSchema: member,
    destField: ["groupId", "userId"],
  }),
}));

const memberRelationships = relationships(member, ({ one }) => ({
  group: one({
    sourceField: ["groupId"],
    destSchema: group,
    destField: ["id"],
  }),
}));

const expenseRelationships = relationships(expense, ({ one, many }) => ({
  group: one({
    sourceField: ["groupId"],
    destSchema: group,
    destField: ["id"],
  }),
  expenseMembers: many({
    sourceField: ["id"],
    destSchema: expenseMember,
    destField: ["expenseId"],
  }),
}));

const expenseMemberRelationships = relationships(expenseMember, ({ one }) => ({
  member: one({
    sourceField: ["groupId", "userId"],
    destSchema: member,
    destField: ["groupId", "userId"],
  }),
}));

// types
export type Expense = Row<typeof schema.tables.expense>;
export type Group = Row<typeof schema.tables.group>;
export type Member = Row<typeof schema.tables.member>;

// schema
export type Schema = typeof schema;
export const schema = createSchema({
  tables: [preference, group, member, expense, expenseMember],
  relationships: [
    groupRelationships,
    memberRelationships,
    expenseRelationships,
    expenseMemberRelationships,
  ],
});

// permissions
export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    preference: ANYONE_CAN_DO_ANYTHING,
    group: ANYONE_CAN_DO_ANYTHING,
    member: ANYONE_CAN_DO_ANYTHING,
    expense: ANYONE_CAN_DO_ANYTHING,
    expenseMember: ANYONE_CAN_DO_ANYTHING,
  } satisfies PermissionsConfig<AuthData, Schema>;
});
