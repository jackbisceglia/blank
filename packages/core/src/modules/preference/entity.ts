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
import { Preference, PreferenceInsert, preferenceTable } from "./schema";
import { eq } from "drizzle-orm/sql";
import { db } from "../../lib/drizzle";

class PreferenceNotFoundError extends TaggedError("PreferenceNotFoundError") {}
class PreferenceNotCreatedError extends TaggedError(
  "PreferenceNotCreatedError",
) {}
class PreferenceNotUpdatedError extends TaggedError(
  "PreferenceNotUpdatedError",
) {}

export namespace preferences {
  export function getByUserId(userId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.preferenceTable.findFirst({
          where: eq(preferenceTable.userId, userId),
        }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (preference) => preference,
          error: () => new PreferenceNotFoundError("Preference not found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching preference by userId", e),
      ),
      Effect.catchTag("PreferenceNotFoundError", () =>
        Effect.succeed({
          userId,
          defaultGroupId: null,
        } satisfies Preference),
      ),
    );
  }

  export function create(preference: PreferenceInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).insert(preferenceTable).values(preference).returning(),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new PreferenceNotCreatedError("Preference not created"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate preference"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating preference", e),
      ),
    );
  }

  export function upsert(
    userId: string,
    defaultGroupId: string,
    tx?: Transaction,
  ) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(preferenceTable)
          .values({ userId, defaultGroupId })
          .onConflictDoUpdate({
            target: preferenceTable.userId,
            set: { defaultGroupId },
          })
          .returning(),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new PreferenceNotUpdatedError("Preference not updated"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate preference"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed upserting preference", e),
      ),
    );
  }

  export function removeAll(tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .delete(preferenceTable)
          .returning({ userId: preferenceTable.userId }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to remove preferences", e),
      ),
    );
  }
}
