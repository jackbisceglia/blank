import {
  DrizzleError,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { PgTable, text } from "drizzle-orm/pg-core";
import { ResultAsync } from "neverthrow";
import { db } from ".";
import { TaggedError } from "../utils";
import { Effect } from "effect";

export class DatabaseReadError extends TaggedError("DatabaseReadError") {}
export class DatabaseWriteError extends TaggedError("DatabaseWriteError") {}
export class DatabaseTransactionError extends TaggedError(
  "DatabaseTransactionError"
) {}

export type DrizzleResult<T, R = DrizzleError> = ResultAsync<T, R>;

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

export function handleDrizzleError(error: unknown) {
  return error instanceof DrizzleError
    ? error
    : new DrizzleError({
        message: "Drizzle Error",
        cause: error,
      });
}

export function fromDrizzleThrowable<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => DrizzleError
) {
  return ResultAsync.fromThrowable(fn, errorHandler ?? handleDrizzleError);
}

export const uuidv7 = () => text();

// export const uuidv7WithDefault = () => uuidv7().$defaultFn(genUUIDv7);

export type DrizzleModelTypes<Model extends PgTable> = {
  Select: InferSelectModel<Model>;
  Insert: InferInsertModel<Model>;
};

export const clean = (input: string[]) =>
  input.map((item) => item.trim()).filter((item) => item);

export type Transaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];
