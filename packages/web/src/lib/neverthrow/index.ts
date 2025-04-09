import { ok } from "neverthrow";
import { Result } from "neverthrow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResultSuccess<T> = T extends Result<infer S, any> ? S : never;

export function tap<T>(
  fn: (value: T) => Result<void, Error> | undefined | false
): (value: T) => Result<void, Error> {
  return (value: T) => {
    return fn(value) || ok(undefined);
  };
}
