import { schema } from "@blank/zero";
import {
  CustomMutatorDefs,
  Transaction as TransactionInternal,
} from "@rocicorp/zero";
import { OpenAuthToken } from "@blank/auth/subjects";
import { mutators as expenseMutators } from "./expense-mutators";
import { mutators as participantMutators } from "./participant-mutators";
import { mutators as groupMutators } from "./group-mutators";
import { mutators as memberMutators } from "./member-mutators";

export type ZTransaction = TransactionInternal<typeof schema>;

export type ClientMutator<T, R> = (tx: ZTransaction, opts: T) => Promise<R>;

export type ClientMutatorGroup<T> = (auth: OpenAuthToken | undefined) => T;

export type ClientMutators = ReturnType<typeof createClientMutators>;
export type CreateMutators = CustomMutatorDefs<typeof schema>;

export function assertIsAuthenticated(auth: OpenAuthToken | undefined) {
  if (!auth) throw new Error("Not authenticated");

  return auth;
}

export async function assertUserIsGroupMember(
  tx: ZTransaction,
  groupId: string,
  userId: string,
) {
  const member = await tx.query.member
    .where("groupId", groupId)
    .where("userId", userId)
    .one()
    .run();

  if (!member) throw new Error("Must be a group member to perform this action");
}

export function createClientMutators(auth: OpenAuthToken | undefined) {
  return {
    expense: expenseMutators(auth),
    participant: participantMutators(auth),
    group: groupMutators(auth),
    member: memberMutators(auth),
  } as const satisfies CreateMutators;
}
