import { mistral } from '@ai-sdk/mistral';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

type ValueOf<T> = T[keyof T];

type LLMProvider<T extends keyof typeof providers> = {
  provider: T;
  model: ValueOf<(typeof models)[T]>;
};

type OpenAI = LLMProvider<typeof providers.openai>;
type Mistral = LLMProvider<typeof providers.mistral>;

type LLMProviders = OpenAI | Mistral;

export type LLMOptions = {
  llm: LLMProviders;
};

export const constants = {
  sender: 'SENDER',
  unrelated: 'UNRELATED',
};

export const providers = {
  openai: 'openai',
  mistral: 'mistral',
  default: 'openai',
} as const;

export const models = {
  [providers.openai]: {
    ['3.5-turbo']: 'gpt-3.5-turbo',
    ['4']: 'gpt-4',
    ['4o']: 'gpt-4o',
    default: 'gpt-4o',
  },
  [providers.mistral]: {
    large: 'mistral-large-latest',
    nemo: 'mistral-nemo-latest',
    default: 'mistral-large-latest',
  },
  default: {
    default: 'gpt-4o',
  },
} as const;

const vercelAIProviders = {
  [providers.openai]: openai,
  [providers.mistral]: mistral,
};

export const llmToObject = async <T>(
  grounding: string,
  input: string,
  schema: z.ZodType<T>,
  opts?: LLMOptions,
) => {
  const llm = {
    provider: opts?.llm.provider ?? providers.default,
    model: opts?.llm.model ?? models[providers.default].default,
  };

  const host = vercelAIProviders[llm.provider];

  const { object } = await generateObject({
    model: host(llm.model),
    schema,
    system: grounding,
    prompt: input,
  });

  if (!object) {
    throw new Error('LLM did not return an object');
  }

  return object;
};

export class LoggerBuilder {
  private content: string;

  constructor(initial: string | undefined) {
    this.content = initial ?? '';
  }

  pad(size: number | { t?: number; b?: number }): this {
    const top = size instanceof Object ? size.t : size;
    const bottom = size instanceof Object ? size.b : size;

    const topBuffer = Array.from({ length: top ?? 0 });
    const bottomBuffer = Array.from({ length: bottom ?? 0 });

    this.content = [...topBuffer, this.content, ...bottomBuffer].join('\n');

    return this;
  }

  separate(lines: string[]): this {
    this.content = lines.join('\n');

    return this;
  }

  out(): void {
    if (typeof this.content !== 'string') {
      this.separate(this.content);
    }

    console.log(this.content);
  }
}

// i have no idea why i/ai even wrote this but it looks cool
export function logger(initial?: string) {
  return new LoggerBuilder(initial);
}
