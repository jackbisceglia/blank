import {
  createSchema,
  definePermissions,
  PermissionsConfig,
  Row,
  enumeration,
  number,
  json,
  string,
  table,
  relationships,
} from "@rocicorp/zero";
import { useRuleSet } from "./ruleset";

export type AuthData = {
  sub: string | null;
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
    date: number(),
    description: string(),
    status: enumeration<"active" | "settled">(),
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

const participant = table("participant")
  .columns({
    expenseId: string(),
    groupId: string(),
    userId: string(),
    role: enumeration<"payer" | "participant">(),
    split: json<[number, number]>(),
  })
  .primaryKey("expenseId", "userId");

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
  defaults: many({
    sourceField: ["id"],
    destSchema: preference,
    destField: ["defaultGroupId"],
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
  participants: many({
    sourceField: ["id"],
    destField: ["expenseId"],
    destSchema: participant,
  }),
}));

const participantRelationships = relationships(participant, ({ one }) => ({
  member: one({
    sourceField: ["groupId", "userId"],
    destSchema: member,
    destField: ["groupId", "userId"],
  }),
}));

const preferencesRelationships = relationships(preference, ({ one }) => ({
  defaultGroup: one({
    sourceField: ["defaultGroupId"],
    destSchema: group,
    destField: ["id"],
  }),
}));

// types
export type Expense = Row<typeof schema.tables.expense>;
export type Group = Row<typeof schema.tables.group>;
export type Member = Row<typeof schema.tables.member>;
export type Participant = Row<typeof schema.tables.participant>;

// schema
export type Schema = typeof schema;
export const schema = createSchema({
  tables: [preference, group, member, expense, participant],
  relationships: [
    groupRelationships,
    memberRelationships,
    expenseRelationships,
    participantRelationships,
    preferencesRelationships,
  ],
});

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    preference: {
      row: {
        select: useRuleSet("MustBeAuthenticated", "MustBePreferenceOwner"),
      },
    },
    group: {
      row: {
        select: useRuleSet("MustBeAuthenticated", "MustBeGroupMember"),
      },
    },
    member: {
      row: {
        select: useRuleSet("MustBeAuthenticated", "MustBeCoMember"),
      },
    },
    expense: {
      row: {
        select: useRuleSet("MustBeAuthenticated", "MustBeCoMemberExpense"),
      },
    },
    participant: {
      row: {
        select: useRuleSet("MustBeAuthenticated", "MustBeCoMemberParticipant"),
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});
