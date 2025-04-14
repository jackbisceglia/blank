import {
  AISDKError,
  generateObject,
  JSONValue,
  LanguageModel,
  Schema,
} from "ai";
import { ResultAsync } from "neverthrow";
import { create } from "./models";

export function handleAISdkError(error: unknown) {
  return error instanceof AISDKError
    ? error
    : new AISDKError({
        name: "AI SDK Error",
        message: "Unknown error in AI SDK Call",
        cause: error,
      });
}

// NOTE: it would be wonderful to just take this from the 'ai' so i can wrap with exactly the types it expects
type SafeGenerateOptions<TSchema> = {
  model?: LanguageModel;
  mode?: "auto" | "json" | "tool";

  schema: Schema<TSchema>;
  schemaName?: string;
  schemaDescription?: string;

  providerOptions?: Record<string, Record<string, JSONValue>>;
  system?: string;
};

export function createSafeGenerateObject<TSchema>(
  opts: SafeGenerateOptions<TSchema>,
  errorHandler?: (error: unknown) => AISDKError
) {
  const defaults = { output: "object", model: create() } as const;

  function query(prompt: string) {
    return generateObject({
      ...defaults,
      ...opts,
      prompt,
      experimental_telemetry: {
        isEnabled: true,
      },
    });
  }

  return ResultAsync.fromThrowable(query, errorHandler ?? handleAISdkError);
}
