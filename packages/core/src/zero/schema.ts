import {
  ANYONE_CAN,
  Row,
  createSchema,
  createTableSchema,
  definePermissions,
} from '@rocicorp/zero';

const preferenceSchema = createTableSchema({
  tableName: 'preference',
  columns: {
    userId: { type: 'string' },
    defaultGroupId: { type: 'string' },
  },
  primaryKey: ['userId', 'defaultGroupId'],
});

const groupSchema = createTableSchema({
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
      sourceField: 'ownerId',
      destField: 'id',
      destSchema: () => memberSchema,
    },
  },
});

const memberSchema = createTableSchema({
  tableName: 'member',
  columns: {
    id: { type: 'string' },
    groupId: { type: 'string' },
    userId: { type: 'string' },
    nickname: { type: 'string' },
  },
  primaryKey: ['id'],
});

const transactionSchema = createTableSchema({
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
    payees: [
      {
        sourceField: 'id',
        destField: 'transactionId',
        destSchema: () => payeeSchema,
      },
      {
        sourceField: 'memberId',
        destField: 'id',
        destSchema: () => memberSchema,
      },
    ],
  },
});

export type Transaction = Row<typeof transactionSchema> & {
  payees: readonly Row<typeof memberSchema>[];
};

const payeeSchema = createTableSchema({
  tableName: 'payee',
  columns: {
    id: { type: 'string' },
    transactionId: { type: 'string' },
    memberId: { type: 'string' },
  },
  primaryKey: ['id'],
});

export const schema = createSchema({
  version: 1,
  tables: {
    preference: preferenceSchema,
    group: groupSchema,
    member: memberSchema,
    transaction: transactionSchema,
    payee: payeeSchema,
  },
});
export type Schema = typeof schema;

type AuthData = {
  sub: string | null;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    group: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});
