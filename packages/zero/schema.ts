import {
  ANYONE_CAN,
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
  ExpressionBuilder,
} from "@rocicorp/zero";

type AuthData = {
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
  ],
});

type Tables = keyof Schema["tables"];
type Expression<T extends Tables> = ExpressionBuilder<Schema, T>;

// permissions
export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  // This rule allows operations only when the user is NOT authenticated (sub is null)
  // When authData.sub is null, the user is unauthenticated and operations are allowed
  // When authData.sub has a value, the user is authenticated and operations are blocked
  class Rules<T extends Tables> {
    private sub: AuthData["sub"] | null;
    private expression: Expression<T>;

    constructor(authentication: AuthData | null, expression: Expression<T>) {
      this.sub = authentication?.sub ?? null;
      this.expression = expression;
    }

    isAuthenticated() {
      return this.expression.cmpLit(this.sub, "IS NOT", null);
    }

    isMemberOfGroup() {
      return this.expression.cmpLit(this.sub, "IS NOT", null);
    }
  }

  // use a single permission
  const rule =
    <TSpecifiedTable extends Tables>(rule: keyof InstanceType<typeof Rules>) =>
    <T extends Tables>(
      authentication: AuthData,
      expression: Expression<
        TSpecifiedTable extends never ? T : TSpecifiedTable
      >,
    ) =>
      new Rules(authentication, expression)[rule]();

  return {
    preference: {
      row: {
        select: [rule("isAuthenticated")],
      },
    },
    group: {
      row: {
        select: [rule<"group">("isAuthenticated")],
      },
    },
    member: {
      row: {
        select: [rule("isAuthenticated")],
      },
    },
    expense: {
      row: {
        select: [rule("isAuthenticated")],
      },
    },
    participant: {
      row: {
        select: [rule("isAuthenticated")],
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});
