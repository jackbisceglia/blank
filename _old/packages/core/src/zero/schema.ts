import {
  ANYONE_CAN,
  ExpressionBuilder,
  Row,
  TableSchema,
  createSchema,
  createTableSchema,
  definePermissions,
} from '@rocicorp/zero';

const preferenceSchema = {
  tableName: 'preference',
  columns: {
    userId: { type: 'string' },
    defaultGroupId: { type: 'string' },
  },
  primaryKey: ['userId', 'defaultGroupId'],
} as const;

const groupSchema = {
  tableName: 'group',
  columns: {
    id: { type: 'string' },
    title: { type: 'string' },
    ownerId: { type: 'string' },
    invitationId: { type: 'string', optional: true },
  },
  primaryKey: ['id'],
  relationships: {
    transactions: {
      sourceField: 'id',
      destField: 'groupId',
      destSchema: () => transactionSchema,
    },
    members: {
      sourceField: 'id',
      destField: 'groupId',
      destSchema: () => memberSchema,
    },
    owner: {
      sourceField: ['id', 'ownerId'],
      destField: ['groupId', 'userId'],
      destSchema: () => memberSchema,
    },
  },
} as const;

const memberSchema = {
  tableName: 'member',
  columns: {
    groupId: { type: 'string' },
    userId: { type: 'string' },
    nickname: { type: 'string' },
  },
  primaryKey: ['groupId', 'userId'],
  relationships: {
    group: {
      sourceField: 'groupId',
      destField: 'id',
      destSchema: () => groupSchema,
    },
  },
} as const;

export type Member = Row<typeof memberSchema>;

const transactionSchema = {
  tableName: 'transaction',
  columns: {
    id: { type: 'string' },
    groupId: { type: 'string' },
    payerId: { type: 'string' },
    amount: { type: 'number' },
    date: { type: 'number' },
    description: { type: 'string' },
  },
  primaryKey: ['id'],
  relationships: {
    group: {
      sourceField: 'groupId',
      destField: 'id',
      destSchema: () => groupSchema,
    },
    transactionMembers: {
      sourceField: 'id',
      destField: 'transactionId',
      destSchema: () => transactionMemberSchema,
    },
  },
} as const;

export type Transaction = Row<typeof transactionSchema> & {
  transactionMembers: readonly Row<typeof memberSchema>[];
};

const transactionMemberSchema = createTableSchema({
  tableName: 'transactionMember',
  columns: {
    transactionId: { type: 'string' },
    groupId: { type: 'string' },
    userId: { type: 'string' },
    // share: { type: 'number' }, // if you need to track how much each person owes
  },
  primaryKey: ['transactionId', 'groupId', 'userId'],
  // This ensures the member actually exists in the group
  relationships: {
    members: {
      sourceField: ['groupId', 'userId'],
      destField: ['groupId', 'userId'],
      destSchema: () => memberSchema,
    },
  },
});

export const schema = createSchema({
  version: 1,
  tables: {
    preference: preferenceSchema,
    group: groupSchema,
    member: memberSchema,
    transaction: transactionSchema,
    transactionMember: transactionMemberSchema,
  },
});
export type Schema = typeof schema;

type AuthData = {
  sub: string;
};

// helpers
type PermissionFunction<TSchema extends TableSchema> = (
  authData: AuthData,
  ops: ExpressionBuilder<TSchema>,
) => ReturnType<ExpressionBuilder<TSchema>['exists' | 'cmp']>;

function and<TSchema extends TableSchema>(
  ...rules: PermissionFunction<TSchema>[]
): PermissionFunction<TSchema> {
  return (authData, eb) => eb.and(...rules.map((rule) => rule(authData, eb)));
}

// function not<TSchema extends TableSchema>(
//   rule: PermissionFunction<TSchema>,
// ): PermissionFunction<TSchema> {
//   return (authData, eb) => eb.not(rule(authData, eb));
// }

// function or<TSchema extends TableSchema>(
//   ...rules: PermissionFunction<TSchema>[]
// ): PermissionFunction<TSchema> {
//   return (authData, eb) => eb.or(...rules.map((rule) => rule(authData, eb)));
// }

// can be used to grab the group relation from different tables for a permission
function useGroup(
  permission: PermissionFunction<typeof groupSchema>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  table: typeof memberSchema | typeof transactionSchema,
) {
  return (authData: AuthData, ops: ExpressionBuilder<typeof table>) =>
    ops.exists('group', (group) => group.where((g) => permission(authData, g)));
}

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  // group
  type GroupPerm = PermissionFunction<typeof groupSchema>;

  const whenUserBelongsToGroup: GroupPerm = (authData, ops) =>
    ops.exists('members', (member) =>
      member.where((m) => m.cmp('userId', '=', authData.sub)),
    );

  const whenUserDoesNotBelongToGroup: GroupPerm = (authData, ops) =>
    ops.exists('members', (member) =>
      member.where((m) => m.cmp('userId', '=', authData.sub)),
    );

  const whenUserOwnsGroup: GroupPerm = (authData, ops) =>
    ops.cmp('ownerId', '=', authData.sub);

  // member
  type MemberPerm = PermissionFunction<typeof memberSchema>;
  const whenMemberIsUser: MemberPerm = (authData, ops) =>
    ops.cmp('userId', '=', authData.sub);

  // transaction
  type TransactionPerm = PermissionFunction<typeof transactionSchema>;
  const whenUserIsPayerOrPayee: TransactionPerm = (authData, ops) =>
    ops.or(
      ops.cmp('payerId', '=', authData.sub),
      ops.exists('transactionMembers', (tMember) =>
        tMember.where((tm) => tm.cmp('userId', '=', authData.sub)),
      ),
    );

  return {
    group: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: {
          preMutation: [whenUserOwnsGroup],
        },
        delete: [whenUserOwnsGroup],
      },
    },
    member: {
      // note: should users only have these perms if it is themselves
      row: {
        select: [useGroup(whenUserBelongsToGroup, memberSchema)],
        insert: [useGroup(whenUserDoesNotBelongToGroup, memberSchema)],
        update: {
          preMutation: [
            and(
              whenMemberIsUser,
              useGroup(whenUserBelongsToGroup, memberSchema),
            ),
          ],
        },
        delete: [
          and(whenMemberIsUser, useGroup(whenUserBelongsToGroup, memberSchema)),
        ],
      },
    },
    transaction: {
      row: {
        select: [useGroup(whenUserBelongsToGroup, transactionSchema)],
        insert: [useGroup(whenUserBelongsToGroup, transactionSchema)],
        update: {
          preMutation: [useGroup(whenUserBelongsToGroup, transactionSchema)],
        },
        delete: [
          and(
            whenUserIsPayerOrPayee,
            useGroup(whenUserBelongsToGroup, transactionSchema),
          ),
        ],
      },
    },
  };
});
