import { mistral } from "@ai-sdk/mistral";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const constants = {
  sender: "SENDER",
  unrelated: "UNRELATED",
};

export const providers = {
  openai: "openai",
  mistral: "mistral",
  default: "openai",
} as const;

const models = {
  openai: openai("gpt-4o"),
  mistral: mistral("mistral-large-latest"),
  default: openai("gpt-4o"),
};

export type LLMOptions = {
  provider: keyof typeof providers;
};

export const llmToObject = async <T>(
  grounding: string,
  input: string,
  schema: z.ZodType<T>,
  opts?: LLMOptions,
) => {
  const { object } = await generateObject({
    model: opts?.provider ? models[opts.provider] : models.openai,
    schema,
    system: grounding,
    prompt: input,
  });

  if (!object) {
    throw new Error("LLM did not return an object");
  }

  return object;
};
