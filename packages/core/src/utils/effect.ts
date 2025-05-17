import { Data, Match, Effect } from "effect";

/**
 * Creates a tagged error class with a specific name and error structure.
 * @template T - The string literal type for the error name
 * @param name - The name of the error class
 * @returns A class that extends Data.TaggedError with the specified name
 */
export function TaggedError<T extends string>(name: T) {
  type E = {
    message: string;
    cause?: unknown;
  };

  return class extends Data.TaggedError(name)<E> {
    constructor(message: string, cause?: unknown) {
      super({ message, cause });
    }
  };
}

/**
 * Requires exactly one element in an array and handles success/empty/duplicate cases.
 * @template TElement - The type of elements in the array
 * @template TEmptyError - The error type returned when no elements are found
 * @template TSuccess - The success type (defaults to TElement)
 * @param context - Configuration object for handling different cases
 * @param context.success - Optional function to transform the single element
 * @param context.empty - Function to create error when no elements found
 * @param context.dup - Function to create error when multiple elements found
 * @returns A function that processes an array and returns an Effect, dies if multiple elements found
 */
export function requireSingleElement<
  TElement,
  TEmptyError,
  TSuccess = TElement,
>(context: {
  success?: (row: TElement) => TSuccess;
  empty: () => TEmptyError;
  dup: () => unknown;
}) {
  return (rows: TElement[]) =>
    Match.value(rows.length).pipe(
      Match.when(1, () =>
        context.success
          ? Effect.succeed(context.success(rows[0]))
          : Effect.succeed(rows[0] as unknown as TSuccess)
      ),
      Match.when(0, () => Effect.fail(context.empty())),
      Match.orElse(() => Effect.die(context.dup()))
    );
}

/**
 * Requires at least one element in an array and handles success/empty cases.
 * @template TElement - The type of elements in the array
 * @template TSuccess - The success type (defaults to TElement[])
 * @template TEmptyError - The error type returned when no elements are found
 * @param context - Configuration object for handling different cases
 * @param context.success - Optional function to transform the array of elements
 * @param context.empty - Function to create error when no elements found
 * @returns A function that processes an array and returns an Effect
 */
export function requireManyElements<
  TElement,
  TSuccess = TElement[],
  TEmptyError = unknown,
>(context: {
  success?: (rows: TElement[]) => TSuccess;
  empty: () => TEmptyError;
}) {
  return (rows: TElement[]) =>
    Match.value(rows.length).pipe(
      Match.when(0, () => Effect.fail(context.empty())),
      Match.orElse(() =>
        context.success
          ? Effect.succeed(context.success(rows))
          : Effect.succeed(rows as TSuccess)
      )
    );
}

/**
 * Requires a value to exist (not null or undefined) and handles success/error cases.
 * @template TValue - The type of the value to check
 * @template TError - The error type returned when value doesn't exist
 * @template TSuccess - The success type (defaults to TValue)
 * @param context - Configuration object for handling different cases
 * @param context.success - Optional function to transform the value
 * @param context.error - Function to create error when value doesn't exist
 * @returns A function that processes a value and returns an Effect
 */
export function requireValueExists<TValue, TError, TSuccess = TValue>(context: {
  success?: (value: TValue) => TSuccess;
  error: () => TError;
}) {
  return (value: TValue | null | undefined) => {
    if (!value) return Effect.fail(context.error());

    return context.success
      ? Effect.succeed(context.success(value as TValue))
      : Effect.succeed(value as TSuccess);
  };
}
