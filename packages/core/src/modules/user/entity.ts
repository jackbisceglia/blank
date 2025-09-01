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
import { User, UserInsert, userTable } from "./schema";
import { eq } from "drizzle-orm/sql";
import { db } from "../../lib/drizzle";
import { memberTable } from "../member/schema";
import { organization } from "../organization/entity";

class UserNotFoundError extends TaggedError("UserNotFoundError") {}
class UserNotCreatedError extends TaggedError("UserNotCreatedError") {}
class DuplicateUserError extends TaggedError("DuplicateUserError") {}
class UserNotRemovedError extends TaggedError("UserNotRemovedError") {}
class UserNotUpdatedError extends TaggedError("UserNotUpdatedError") {}

export namespace users {
  export function getByEmail(email: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.userTable.findFirst({
          where: eq(userTable.email, email),
        }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (user) => user.id,
          error: () => new UserNotFoundError("User not found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching user by email", e),
      ),
    );
  }

  export function getById(id: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.userTable.findFirst({ where: eq(userTable.id, id) }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (user) => user,
          error: () => new UserNotFoundError("User not found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching user by id", e),
      ),
    );
  }

  export function getMemberships(userId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.memberTable.findMany({
          where: eq(memberTable.userId, userId),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) =>
          new DatabaseReadError(
            "Failed fetching members by user id",
            e,
          ),
      ),
    );
  }

  export const create = Effect.fn("createUser")(function* (
    user: UserInsert,
    tx?: Transaction,
  ) {
    const plan = yield* Effect.fn("getTopPlan")(
      function* () {
        const orgs = yield* organization.belongsTo(user.email, tx);

        const topPlan = yield* organization.prioritize(orgs);

        return topPlan;
      },
      Effect.catchTag("OrganizationLookupError", () =>
        Effect.succeed("base" as const),
      ),
    )();

    const rows = yield* Effect.tryPromise(() =>
      (tx ?? db)
        .insert(userTable)
        .values({
          ...user,
          plan,
        })
        .returning({ id: userTable.id, name: userTable.name }),
    );

    const row = yield* requireSingleElement({
      empty: () => new UserNotCreatedError("User not created"),
      success: (row: Pick<User, "id" | "name">) => row,
      dup: () => new DuplicateUserError("Duplicate user found"),
    })(rows);

    return row;
  });

  export function remove(id: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .delete(userTable)
          .where(eq(userTable.id, id))
          .returning({ id: userTable.id }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new UserNotRemovedError("User not Removed"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate user deletion"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to Remove user", e),
      ),
    );
  }

  export function removeAll(tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).delete(userTable).returning({ id: userTable.id }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to remove users", e),
      ),
    );
  }

  export function update(
    id: string,
    updates: { name?: string; image?: string },
    tx?: Transaction,
  ) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .update(userTable)
          .set(updates)
          .where(eq(userTable.id, id))
          .returning({
            id: userTable.id,
            name: userTable.name,
            image: userTable.image,
          }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new UserNotUpdatedError("User not updated"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate user update"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to update user", e),
      ),
    );
  }
}
