import { Effect, pipe } from "effect";
import {
  DatabaseReadError,
  DatabaseWriteError,
  Transaction,
} from "../../lib/drizzle/utils";
import {
  requireManyElements,
  requireSingleElement,
  requireValueExists,
  TaggedError,
} from "../../lib/effect";
import { db } from "../../lib/drizzle";
import { GroupInsert, groupTable } from "./schema";
import { eq } from "drizzle-orm/sql";
import { inviteTable } from "../invite/schema";

class GroupNotFoundError extends TaggedError("GroupNotFoundError") {}
class MembersNotFoundError extends TaggedError("MembersNotFoundError") {}
class GroupNotCreatedError extends TaggedError("GroupNotCreatedError") {}
class DuplicateGroupError extends TaggedError("DuplicateGroupError") {}
class GroupsNotCreatedError extends TaggedError("GroupsNotCreatedError") {}
class GroupNotDeletedError extends TaggedError("GroupNotDeletedError") {}

export namespace groups {
  export function getById(id: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.groupTable.findFirst({ where: eq(groupTable.id, id) }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (group) => group,
          error: () => new GroupNotFoundError("Group not found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching group by id", e),
      ),
    );
  }

  export function getMembers(groupId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.groupTable.findFirst({
          where: eq(groupTable.id, groupId),
          with: { members: true },
        }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (group) => group.members,
          error: () => new GroupNotFoundError("Group not found"),
        }),
      ),
      Effect.flatMap(
        requireManyElements({
          success: (members) => members,
          empty: () => new MembersNotFoundError("Members not found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching members by group id", e),
      ),
    );
  }

  export function getPendingInvites(groupId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.groupTable.findFirst({
          where: eq(groupTable.id, groupId),
          with: { invites: { where: eq(inviteTable.status, "pending") } },
        }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (group) => group.invites,
          error: () => new GroupNotFoundError("Group not found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching invites by group id", e),
      ),
    );
  }

  export function create(group: GroupInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(groupTable)
          .values(group)
          .returning({ id: groupTable.id }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new GroupNotCreatedError("Group not created"),
          dup: () => new DuplicateGroupError("Duplicate group found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating group", e),
      ),
    );
  }

  export function createMany(groups: GroupInsert[], tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(groupTable)
          .values(groups)
          .returning({ id: groupTable.id }),
      ),
      Effect.flatMap((rows) => {
        return rows.length === groups.length
          ? Effect.succeed(rows)
          : Effect.fail(new GroupsNotCreatedError("Groups were not inserted"));
      }),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating groups", e),
      ),
    );
  }

  export function remove(id: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .delete(groupTable)
          .where(eq(groupTable.id, id))
          .returning({ id: groupTable.id }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new GroupNotDeletedError("Group not deleted"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate group deletion"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to delete group", e),
      ),
    );
  }

  export function removeAll(tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).delete(groupTable).returning({ id: groupTable.id }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to delete groups", e),
      ),
    );
  }
}
