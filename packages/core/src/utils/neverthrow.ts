import { err, ok, ResultAsync } from "neverthrow";
import * as v from "valibot";
import { ValidationError } from "./effect";

// in progress of getting rid of this file

// this is useful when interoping with 3rd party libraries where they depend on promises throwing errors for control flow
export async function unwrapOrThrow<T, E>(
  resultPromise: ResultAsync<T, E>
): Promise<T> {
  const result = await resultPromise;
  if (result.isErr()) {
    throw result.error as unknown;
  }
  return result.value;
}

export function fromParsed<T, R>(
  schema: v.GenericSchema<T, R>,
  value: unknown
) {
  const result = v.safeParse(schema, value);

  return result.success
    ? ok(result.output)
    : err(new ValidationError(result.issues));
}
