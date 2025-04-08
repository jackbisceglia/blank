import { err, ok } from "neverthrow";
import * as v from "valibot";

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
