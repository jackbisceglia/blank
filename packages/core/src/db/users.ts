import { db, userTable } from ".";

import { eq } from "drizzle-orm";
import { User, UserInsert } from "./user.schema";
import { TaggedError } from "./utils";
import { Effect, pipe } from "effect";

class DatabaseReadError extends TaggedError("DatabaseReadError") {}
class DatabaseWriteError extends TaggedError("DatabaseWriteError") {}
class UserNotFoundError extends TaggedError("UserNotFoundError") {}
class DuplicateUserError extends TaggedError("DuplicateUserError") {}
class UserNotCreatedError extends TaggedError("UserNotCreatedError") {}

export namespace users {
  export function getByEmail(email: string) {
    const queryUserByEmail = Effect.tryPromise({
      try: () =>
        db.query.userTable.findFirst({ where: eq(userTable.email, email) }),
      catch: (error) =>
        new DatabaseReadError("Failed fetching user by email", error),
    });

    const assertUserExists = Effect.filterOrFail(
      (user): user is User => user !== undefined,
      () => new UserNotFoundError("User not found")
    );

    return pipe(queryUserByEmail, assertUserExists);
  }

  export function getById(id: string) {
    const queryUserById = Effect.tryPromise({
      try: () => db.query.userTable.findFirst({ where: eq(userTable.id, id) }),
      catch: (error) =>
        new DatabaseReadError("Failed fetching user by id", error),
    });

    const assertUserExists = Effect.filterOrFail(
      (user): user is User => user !== undefined,
      () => new UserNotFoundError("User not found")
    );

    return pipe(queryUserById, assertUserExists);
  }

  export function create(user: UserInsert) {
    const insertedUser = Effect.tryPromise({
      try: () =>
        db.insert(userTable).values(user).returning({ id: userTable.id }),
      catch: (error) => new DatabaseWriteError("Failed creating user", error),
    });

    const assertUserInserted = Effect.flatMap((rows: { id: string }[]) => {
      switch (rows.length) {
        case 0:
          return Effect.fail(new UserNotCreatedError("User was not inserted"));
        case 1:
          return Effect.succeed(rows[0].id);
        default:
          return Effect.die(new DuplicateUserError("Duplicate user inserted"));
      }
    });

    return pipe(insertedUser, assertUserInserted);
  }
}
