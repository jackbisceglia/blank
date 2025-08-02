import {
  AISDKError,
  convertToCoreMessages,
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

type GenerateCustomOptions = {
  images?: string[];
};

export function createSafeGenerateObject<TSchema>(
  opts: SafeGenerateOptions<TSchema> & GenerateCustomOptions,
  errorHandler?: (error: unknown) => AISDKError,
) {
  const { images, ...rest } = opts;
  const defaults = { output: "object", model: create() } as const;

  function query(prompt: string) {
    // this needs a much more robust solution in the future
    const validImages = (images ?? [])
      .filter((i) => i !== "")
      .filter((i) => {
        if (!i.startsWith("data:image")) return false;
        if (!i.includes(";base64,")) return false;
        return true;
      });

    const attachments = validImages?.map((img, index) => ({
      url: img,
      name: "expense supplement " + index,
      contentType: "image/",
    }));

    const messages = convertToCoreMessages([
      {
        role: "user",
        content: prompt,
        experimental_attachments: attachments,
      },
    ]);

    return generateObject({
      ...defaults,
      ...rest,
      messages,
      experimental_telemetry: {
        isEnabled: true,
      },
    });
  }

  return ResultAsync.fromThrowable(query, errorHandler ?? handleAISdkError);
}
