import { eq } from "drizzle-orm";
import { db } from ".";
import { groupTable } from "./group.schema";
import { DatabaseReadError, Transaction } from "./utils";
import { Effect, pipe } from "effect";
import { requireValueExists, requireManyElements, TaggedError } from "../utils";

class GroupNotFoundError extends TaggedError("GroupNotFoundError") {}
class MembersNotFoundError extends TaggedError("MembersNotFoundError") {}

export namespace groups {
  export function getMembers(groupId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.groupTable.findFirst({
          where: eq(groupTable.id, groupId),
          with: { members: true },
        })
      ),
      Effect.flatMap(
        requireValueExists({
          success: (group) => group.members,
          error: () => new GroupNotFoundError("Group not found"),
        })
      ),
      Effect.flatMap(
        requireManyElements({
          success: (members) => members,
          empty: () => new MembersNotFoundError("Members not found"),
        })
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching members by group id", e)
      )
    );
  }
}
