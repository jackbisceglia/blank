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
import { UserInsert, userTable } from "./schema";
import { eq } from "drizzle-orm/sql";
import { db } from "../../lib/drizzle";

class UserNotFoundError extends TaggedError("UserNotFoundError") {}
class UserNotCreatedError extends TaggedError("UserNotCreatedError") {}
class DuplicateUserError extends TaggedError("DuplicateUserError") {}

export namespace users {
  export function getByEmail(email: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.userTable.findFirst({
          where: eq(userTable.email, email),
        })
      ),
      Effect.flatMap(
        requireValueExists({
          success: (user) => user.id,
          error: () => new UserNotFoundError("User not found"),
        })
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching user by email", e)
      )
    );
  }

  export function getById(id: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.userTable.findFirst({ where: eq(userTable.id, id) })
      ),
      Effect.flatMap(
        requireValueExists({
          success: (user) => user,
          error: () => new UserNotFoundError("User not found"),
        })
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching user by id", e)
      )
    );
  }

  export function create(user: UserInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(userTable)
          .values(user)
          .returning({ id: userTable.id })
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new UserNotCreatedError("User not created"),
          success: (row) => row.id,
          dup: () => new DuplicateUserError("Duplicate user found"),
        })
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating user", e)
      )
    );
  }
}
