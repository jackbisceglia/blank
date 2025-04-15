import {
  DrizzleError,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { PgTable, text } from "drizzle-orm/pg-core";
import { ResultAsync } from "neverthrow";

export type DrizzleResult<T, R = DrizzleError> = ResultAsync<T, R>;

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
