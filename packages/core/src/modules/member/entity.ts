import { Effect, pipe } from "effect";
import {
  DatabaseReadError,
  DatabaseWriteError,
  Transaction,
} from "../../lib/drizzle/utils";
import {
  requireSingleElement,
  requireValueExists,
  TaggedError,
} from "../../lib/effect";
import { MemberInsert, memberTable } from "./schema";
import { db } from "../../lib/drizzle";
import { eq, and } from "drizzle-orm/sql";

class MemberNotFoundError extends TaggedError("MemberNotFoundError") {}
class MemberNotCreatedError extends TaggedError("MemberNotCreatedError") {}
class DuplicateMemberError extends TaggedError("DuplicateMemberError") {}
class MembersNotCreatedError extends TaggedError("MembersNotCreatedError") {}
class MemberNotDeletedError extends TaggedError("MemberNotDeletedError") {}

export namespace members {
  export function get(userId: string, groupId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.memberTable.findFirst({
          where: and(
            eq(memberTable.groupId, groupId),
            eq(memberTable.userId, userId),
          ),
        }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (member) => member,
          error: () => new MemberNotFoundError("Could not find member"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) =>
          new DatabaseReadError(
            "Failed fetching member by group id and user id",
            e,
          ),
      ),
    );
  }

  export function create(member: MemberInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).insert(memberTable).values(member).returning({
          groupId: memberTable.groupId,
          userId: memberTable.userId,
        }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new MemberNotCreatedError("Member not created"),
          success: (row) => row,
          dup: () => new DuplicateMemberError("Duplicate member found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating member", e),
      ),
    );
  }

  export function createMany(members: MemberInsert[], tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).insert(memberTable).values(members).returning({
          groupId: memberTable.groupId,
          userId: memberTable.userId,
        }),
      ),
      Effect.flatMap((rows) => {
        return rows.length === members.length
          ? Effect.succeed(rows)
          : Effect.fail(
              new MembersNotCreatedError("Members were not inserted"),
            );
      }),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating members", e),
      ),
    );
  }

  export function remove(groupId: string, userId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .delete(memberTable)
          .where(
            and(
              eq(memberTable.groupId, groupId),
              eq(memberTable.userId, userId),
            ),
          )
          .returning({
            groupId: memberTable.groupId,
            userId: memberTable.userId,
          }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new MemberNotDeletedError("Member not deleted"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate member deletion"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to delete member", e),
      ),
    );
  }

  export function removeAll(tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).delete(memberTable).returning({
          groupId: memberTable.groupId,
          userId: memberTable.userId,
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to delete members", e),
      ),
    );
  }
}
