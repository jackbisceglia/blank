import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { PgTable, text } from "drizzle-orm/pg-core";
import { Effect } from "effect";
import { TaggedError } from "../effect";
import { db } from ".";

export class DatabaseReadError extends TaggedError("DatabaseReadError") {}
export class DatabaseWriteError extends TaggedError("DatabaseWriteError") {}
class DatabaseTransactionError extends TaggedError(
  "DatabaseTransactionError"
) {}

export type Transaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];

export const withTransaction = <A, E>(
  effect: (tx: Transaction) => Effect.Effect<A, E | DatabaseTransactionError>
): Effect.Effect<A, E | DatabaseTransactionError> =>
  Effect.async<A, E | DatabaseTransactionError>((resume) => {
    db.transaction(async (tx) => {
      const result = await Effect.runPromise(Effect.either(effect(tx)));

      if (result._tag === "Left") {
        resume(Effect.fail(result.left));
      } else {
        resume(Effect.succeed(result.right));
      }
    }).catch((dbError: unknown) => {
      resume(
        Effect.fail(
          new DatabaseTransactionError(
            dbError instanceof Error ? dbError.message : "Unknown error",
            { cause: dbError }
          )
        )
      );
    });
  });

export const uuidv7 = () => text();

export type DrizzleModelTypes<Model extends PgTable> = {
  Select: InferSelectModel<Model>;
  Insert: InferInsertModel<Model>;
};
