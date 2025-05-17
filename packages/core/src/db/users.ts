import { db, userTable } from ".";

import { eq } from "drizzle-orm";
import { User, UserInsert } from "./user.schema";
import { DatabaseReadError, DatabaseWriteError, Transaction } from "./utils";
import { Effect, pipe } from "effect";
import {
  requireSingleElement,
  requireValueExists,
  TaggedError,
} from "../utils";

class UserNotFoundError extends TaggedError("UserNotFoundError") {}
class UserNotCreatedError extends TaggedError("UserNotCreatedError") {}
class DuplicateUserError extends TaggedError("DuplicateUserError") {}

export namespace users {
  export function getByEmail(
    email: string,
    tx?: Transaction
  ): Effect.Effect<string, UserNotFoundError | DatabaseReadError> {
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

  export function getById(
    id: string,
    tx?: Transaction
  ): Effect.Effect<User, UserNotFoundError | DatabaseReadError> {
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
