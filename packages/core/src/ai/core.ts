import { mistral } from '@ai-sdk/mistral';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const constants = {
  sender: 'SENDER',
  unrelated: 'UNRELATED',
};

export const providers = {
  openai: 'openai',
  mistral: 'mistral',
  default: 'openai',
} as const;

const models = {
  openai: openai('gpt-4o'),
  mistral: mistral('mistral-large-latest'),
  default: openai('gpt-4o'),
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
