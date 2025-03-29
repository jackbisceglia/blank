import {
  ANYONE_CAN,
  createSchema,
  definePermissions,
  PermissionsConfig,
  string,
  table,
} from "@rocicorp/zero";

const post = table("post")
  .columns({
    id: string(),
    title: string(),
    content: string(),
  })
  .primaryKey("id");

export const schema = createSchema({
  tables: [post],
});

export type Schema = typeof schema;

type AuthData = {
  sub: string;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    post: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: {
          postMutation: ANYONE_CAN,
          preMutation: ANYONE_CAN,
        },
        delete: ANYONE_CAN,
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});

// const preference = table("preference")
//   .columns({
//     userId: string(),
//     defaultGroupId: string(),
//   })
//   .primaryKey("userId", "defaultGroupId");

// export type Group = typeof group;
// const group = table("group")
//   .columns({
//     id: string(),
//     title: string(),
//     ownerId: string(),
//     invitationId: string().optional(),
//   })
//   .primaryKey("id");

// const groupRelationships = relationships(group, ({ one, many }) => ({
//   transactions: many({
//     sourceField: ["id"],
//     destSchema: transaction,
//     destField: ["groupId"],
//   }),
//   members: many({
//     sourceField: ["id"],
//     destSchema: member,
//     destField: ["groupId"],
//   }),
//   owner: one({
//     sourceField: ["id", "ownerId"],
//     destSchema: member,
//     destField: ["groupId", "userId"],
//   }),
// }));

// export type Member = typeof member;
// const member = table("member")
//   .columns({
//     groupId: string(),
//     userId: string(),
//     nickname: string(),
//   })
//   .primaryKey("groupId", "userId");

// const memberRelationships = relationships(member, ({ one }) => ({
//   groups: one({
//     sourceField: ["groupId"],
//     destSchema: group,
//     destField: ["id"],
//   }),
// }));

// const transaction = table("transaction")
//   .columns({
//     id: string(),
//     groupId: string(),
//     payerId: string(),
//     amount: number(),
//     date: number(),
//     description: string(),
//   })
//   .primaryKey("id");

// export type Transaction = typeof transaction & {
//   transactionMembers: (typeof member)[];
// };

// const transactionRelationships = relationships(member, ({ one, many }) => ({
//   groups: one({
//     sourceField: ["groupId"],
//     destSchema: group,
//     destField: ["id"],
//   }),
//   transactionMembers: many({
//     sourceField: ["id"],
//     destSchema: transactionMember,
//     destField: ["transactionId"],
//   }),
// }));

// const transactionMember = table("transactionMember")
//   .columns({
//     transactionId: string(),
//     groupId: string(),
//     userId: string(),
//   })
//   .primaryKey("transactionId", "groupId", "userId");

// export const schema = createSchema(VERSION, {
//   tables: [preference, group, member, transaction, transactionMember],
//   relationships: [
//     groupRelationships,
//     memberRelationships,
//     transactionRelationships,
//   ],
// });

// export type Schema = typeof schema;

// type AuthData = {
//   sub: string;
// };

// type PermissionFunction<TSchema extends TableSchema> = (
//   authData: AuthData,
//   ops: ExpressionBuilder<TSchema>
// ) => ReturnType<ExpressionBuilder<TSchema>["exists" | "cmp"]>;

// function and<TSchema extends TableSchema>(
//   ...rules: PermissionFunction<TSchema>[]
// ): PermissionFunction<TSchema> {
//   return (authData, eb) => eb.and(...rules.map((rule) => rule(authData, eb)));
// }

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
// function useGroup(
//   permission: PermissionFunction<typeof groupSchema>,
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   table: typeof memberSchema | typeof transactionSchema
// ) {
//   return (authData: AuthData, ops: ExpressionBuilder<typeof table>) =>
//     ops.exists("group", (group) => group.where((g) => permission(authData, g)));
// }

// export const permissions = definePermissions<AuthData, Schema>(schema, () => {
//   // group
//   type GroupPerm = PermissionFunction<typeof groupSchema>;

//   const whenUserBelongsToGroup: GroupPerm = (authData, ops) =>
//     ops.exists("members", (member) =>
//       member.where((m) => m.cmp("userId", "=", authData.sub))
//     );

//   const whenUserDoesNotBelongToGroup: GroupPerm = (authData, ops) =>
//     ops.exists("members", (member) =>
//       member.where((m) => m.cmp("userId", "=", authData.sub))
//     );

//   const whenUserOwnsGroup: GroupPerm = (authData, ops) =>
//     ops.cmp("ownerId", "=", authData.sub);

//   // member
//   type MemberPerm = PermissionFunction<typeof memberSchema>;
//   const whenMemberIsUser: MemberPerm = (authData, ops) =>
//     ops.cmp("userId", "=", authData.sub);

//   // transaction
//   type TransactionPerm = PermissionFunction<typeof transactionSchema>;
//   const whenUserIsPayerOrPayee: TransactionPerm = (authData, ops) =>
//     ops.or(
//       ops.cmp("payerId", "=", authData.sub),
//       ops.exists("transactionMembers", (tMember) =>
//         tMember.where((tm) => tm.cmp("userId", "=", authData.sub))
//       )
//     );

//   return {
//     group: {
//       row: {
//         select: ANYONE_CAN,
//         insert: ANYONE_CAN,
//         update: {
//           preMutation: [whenUserOwnsGroup],
//         },
//         delete: [whenUserOwnsGroup],
//       },
//     },
//     member: {
//       // note: should users only have these perms if it is themselves
//       row: {
//         select: [useGroup(whenUserBelongsToGroup, memberSchema)],
//         insert: [useGroup(whenUserDoesNotBelongToGroup, memberSchema)],
//         update: {
//           preMutation: [
//             and(
//               whenMemberIsUser,
//               useGroup(whenUserBelongsToGroup, memberSchema)
//             ),
//           ],
//         },
//         delete: [
//           and(whenMemberIsUser, useGroup(whenUserBelongsToGroup, memberSchema)),
//         ],
//       },
//     },
//     transaction: {
//       row: {
//         select: [useGroup(whenUserBelongsToGroup, transactionSchema)],
//         insert: [useGroup(whenUserBelongsToGroup, transactionSchema)],
//         update: {
//           preMutation: [useGroup(whenUserBelongsToGroup, transactionSchema)],
//         },
//         delete: [
//           and(
//             whenUserIsPayerOrPayee,
//             useGroup(whenUserBelongsToGroup, transactionSchema)
//           ),
//         ],
//       },
//     },
//   };
// });
