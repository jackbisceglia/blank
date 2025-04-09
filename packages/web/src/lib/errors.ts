import { err } from "neverthrow";

export function CustomError(prefix: string, name: string) {
  return class CustomError extends Error {
    _tag = name;
    constructor(message?: string) {
      super(message ? `${prefix}: ${message}` : prefix);
    }
  };
}

const asErrorCallback =
  <T>(err: T) =>
  (_e: unknown) =>
    err;

export function ErrUtils<T>(error: T) {
  return {
    error: () => error,
    callback: asErrorCallback(error),
    neverthrow: () => err(error),
  };
}
