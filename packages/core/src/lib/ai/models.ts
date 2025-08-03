import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Resource } from "sst";

const providers = {
  openai: createOpenAI({
    apiKey: Resource.AI.openaiApiKey,
  }),
  google: createGoogleGenerativeAI({
    apiKey: Resource.AI.googleGenerativeAiApiKey,
  }),
  groq: createGroq({
    apiKey: Resource.AI.groqApiKey,
  }),
} as const;

// would like to use groq bc of inference speed, but gpt 4o/4.1 are performing vastly more consistently for now

// good, fast, cheap defaults when multi-modal is not needed
export const defaults = {
  quality: "pro.qwen3",
  fast: "pro.qwen3",
} satisfies Record<string, ModelKeys>;

export type ModelKeys = keyof typeof models;

export const models = {
  // openai
  "pro.gpt-4o": () => providers.openai("gpt-4o"),
  "pro.gpt-4.1": () => providers.openai("gpt-4.1"),
  "mini.gpt-4o-mini": () => providers.openai("gpt-4o-mini"),
  "mini.gpt-4.1-mini": () => providers.openai("gpt-4.1-mini"),
  "mini.gpt-4.1-nano": () => providers.openai("gpt-4.1-nano"),

  // llama
  "mini.llama-scout": () =>
    providers.groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  "pro.llama-3.3": () =>
    providers.groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  "pro.llama-maverick": () =>
    providers.groq("meta-llama/llama-4-maverick-17b-128e-instruct"),

  // groq other
  "reasoning.deepseek-r1-llama": () =>
    providers.groq("deepseek-r1-distill-llama-70b"),
  "pro.qwen3": () => providers.groq("qwen/qwen3-32b"),
  "pro.kimi-k2": () => providers.groq("moonshotai/kimi-k2-instruct"),
} as const;

export const create = (model?: ModelKeys) =>
  models[model ?? defaults.quality]();
