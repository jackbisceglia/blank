import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Resource } from "sst";

const providers = {
  openai: createOpenAI({
    apiKey: Resource.AI.openaiApiKey,
  }),
  google: createGoogleGenerativeAI({
    apiKey: Resource.AI.googleGenerativeAiApiKey,
  }),
} as const;

const DEFAULT: ModelKeys = "gpt-4o";

export type ModelKeys = keyof typeof models;

export const models = {
  // openai
  "gpt-4o": () => providers.openai("gpt-4o"),
  "gpt-4o-mini": () => providers.openai("gpt-4o-mini"),
  // google
  "gemini-2.0-flash": () => providers.google("gemini-2.0-flash-001"),
} as const;

export const create = (model?: ModelKeys) => models[model ?? DEFAULT]();
