import { err, ok, ResultAsync, type Result } from "neverthrow";
import * as v from "valibot";

export type ResultSuccess<T> = T extends Result<infer S, unknown> ? S : never;

export class ValidationError<TErrorType> extends Error {
  constructor(
    public readonly issues: [
      v.BaseIssue<TErrorType>,
      ...v.BaseIssue<TErrorType>[],
    ],
    message?: string
  ) {
    const formattedMessage =
      message ??
      issues
        .map((issue) => {
          const path =
            !!issue.path?.length &&
            (issue.path as unknown as string[]).join(".");

          if (!path) return issue.message;

          return `${path}: ${issue.message}`;
        })
        .join(", ");

    super(formattedMessage);
    this.name = "ValidationError";
  }
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

export function orDefaultError<T>(
  error: Error,
  fn: (error: Error) => T | undefined
) {
  return fn(error) ?? error;
}

/**
 * Utility helpers for converting neverthrow Results to and from a serializable format.
 *
 * This is especially useful for serializing server responses and hydrating them back into
 * neverthrow Results on the client-side.
 */

/**
 * Represents a successful server response.
 *
 * @template T The type of the value.
 */
export interface ServerOk<T> {
  value: T;
}

/**
 * Represents an error in the server response.
 *
 * @template E The type of the error.
 */
export interface ServerErr<E> {
  error: E;
}

/**
 * A serializable server result that can either be a success or an error.
 *
 * This type is a union of {@link ServerOk} and {@link ServerErr}.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 */
export type ServerResult<T, E> = ServerOk<T> | ServerErr<E>;

/**
 * Creates a serializable object representing a successful server response.
 *
 * @template T The type of the value.
 * @param value The success value.
 * @returns A {@link ServerOk} instance containing the given value.
 */
export function serverOk<T>(value: T): ServerOk<T> {
  return {
    value,
  };
}

/**
 * Creates a serializable object representing an error in the server response.
 *
 * @template E The type of the error.
 * @param error The error value.
 * @returns A {@link ServerErr} instance containing the given error.
 */
export function serverErr<E>(error: E): ServerErr<E> {
  return {
    error,
  };
}

/**
 * Converts a neverthrow {@link Result} into a serializable {@link ServerResult}.
 *
 * If the input Result is an Ok variant, it returns a {@link ServerOk} containing the value;
 * otherwise, it returns a {@link ServerErr} containing the error.
 *
 * @template T The type of the success value.
 * @template E The type of the error.
 * @param result A neverthrow {@link Result} instance.
 * @returns A serializable {@link ServerResult} instance.
 */
export function serverResult<T, E>(result: Result<T, E>): ServerResult<T, E> {
  if (result.isOk()) {
    return { value: result.value };
  }
  return { error: result.error };
}

/**
 * Hydrates a serializable {@link ServerOk} back into a neverthrow Ok result.
 *
 * @template T The type of the value.
 * @param serverOk The {@link ServerOk} instance to hydrate.
 * @returns A neverthrow Ok result containing the value.
 */
export function hydrateServerOk<T>(serverOk: ServerOk<T>) {
  return ok(serverOk.value);
}

/**
 * Hydrates a serializable {@link ServerErr} back into a neverthrow Err result.
 *
 * @template E The type of the error.
 * @param serverErr The {@link ServerErr} instance to hydrate.
 * @returns A neverthrow Err result containing the error.
 */
export function hydrateServerErr<E>(serverErr: ServerErr<E>) {
  return err<never, E>(serverErr.error);
}

/**
 * Converts a serializable {@link ServerResult} (either success or error) back into a neverthrow {@link Result}.
 *
 * This helper examines the input object: if it contains an `error` property, it converts it using
 * {@link hydrateServerErr}; otherwise, it uses {@link hydrateServerOk}.
 *
 * @template T The type of the success value.
 * @template E The type of the error.
 * @param result A serializable {@link ServerOk} or {@link ServerErr} instance.
 * @returns A neverthrow {@link Result} reconstructed from the serializable object.
 */
export function hydrateServerResult<T, E>(
  result: ServerOk<T> | ServerErr<E>
): Result<T, E> {
  if ("error" in result) {
    return hydrateServerErr(result);
  } else {
    return hydrateServerOk(result);
  }
}

/**
 * Safely hydrates an asynchronous server result promise into a neverthrow {@link ResultAsync}.
 *
 * This helper converts a promise that resolves to a serializable {@link ServerResult} into a
 * {@link ResultAsync} by wrapping the promise with {@link ResultAsync.fromSafePromise} and then
 * mapping the resolved value using {@link hydrateServerResult}.
 *
 * @template T The type of the success value.
 * @template E The type of the error.
 * @param rpcPromise A promise resolving to a serializable {@link ServerResult}.
 * @returns A neverthrow {@link ResultAsync} instance representing the hydrated result.
 */
export function hydrateAsyncServerResult<T, E>(
  rpcCall: () => Promise<ServerResult<T, E>>
): ResultAsync<T, E> {
  return ResultAsync.fromSafePromise(rpcCall()).andThen(hydrateServerResult);
}
