import { anthropic } from '@ai-sdk/anthropic';
import { mistral } from '@ai-sdk/mistral';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

type ValueOf<T> = T[keyof T];

type LLMProvider<T extends keyof typeof providers> = {
  provider: T;
  model?: ValueOf<(typeof models)[T]>;
};

type Anthropic = LLMProvider<typeof providers.anthropic>;
type Mistral = LLMProvider<typeof providers.mistral>;
type OpenAI = LLMProvider<typeof providers.openai>;

export type LLMProviders = Anthropic | Mistral | OpenAI;

export type LLMOptions = LLMProviders;

export const constants = {
  sender: 'SENDER',
  unrelated: 'UNRELATED',
};

export const providers = {
  anthropic: 'anthropic',
  mistral: 'mistral',
  openai: 'openai',
  default: 'openai',
} as const;

export const models = {
  anthropic: {
    sonnet35: 'claude-3-5-sonnet-latest',
    haiku35: 'claude-3-5-haiku-latest',
    opus3: 'claude-3-opus-latest',
    default: 'claude-3-5-sonnet-latest',
  },
  mistral: {
    large: 'mistral-large-latest',
    small: 'mistral-small-latest',
    mini3b: 'ministral-3b-latest',
    mini8b: 'ministral-8b-latest',
    default: 'mistral-large-latest',
  },
  openai: {
    ['3.5-turbo']: 'gpt-3.5-turbo',
    ['4']: 'gpt-4',
    ['4-turbo']: 'gpt-4-turbo',
    ['4o']: 'gpt-4o',
    ['4o-mini']: 'gpt-4o-mini',
    ['o1']: 'o1-preview',
    ['o1-mini']: 'o1-mini',
    default: 'gpt-4o',
  },

  default: {
    default: 'gpt-4o',
  },
} as const;

const vercelAIProviders = {
  [providers.anthropic]: anthropic,
  [providers.mistral]: mistral,
  [providers.openai]: openai,
};

export const llmToObject = async <T>(
  grounding: string,
  input: string,
  schema: z.ZodType<T>,
  opts?: {
    llm?: LLMOptions;
  },
) => {
  const provider = opts?.llm?.provider ?? providers.default;
  const model = opts?.llm?.model ?? models[provider].default;

  const host = vercelAIProviders[provider];

  const { object } = await generateObject({
    model: host(model),
    schema,
    system: grounding,
    prompt: input,
  });

  if (!object) {
    throw new Error('LLM did not return an object');
  }

  return object;
};

export const getLLMDetails = (llm: LLMOptions) => {
  const provider = llm.provider;
  const model = llm.model ?? models[llm.provider].default;

  return { provider, model };
};

// idk why i wrote this, but it's fun
export class LoggerBuilder {
  private content: string | string[];

  constructor(content?: string | string[]) {
    this.content = content ?? '';
  }

  private separate() {
    if (typeof this.content === 'string') return;

    this.content = this.content.join('\n');
  }

  private toArray() {
    if (typeof this.content === 'string') {
      if (this.content === '') {
        this.content = [];
      } else {
        this.content = [this.content];
      }
    }
  }

  pad(size: number | { t?: number; b?: number }): this {
    const top = size instanceof Object ? size.t : size;
    const bottom = size instanceof Object ? size.b : size;

    const topBuffer = Array.from({ length: top ?? 0 });
    const bottomBuffer = Array.from({ length: bottom ?? 0 });

    this.content = [
      ...topBuffer,
      ...[this.content].flat(),
      ...bottomBuffer,
    ].join('\n');

    return this;
  }

  lines(lines: string[]): this {
    if (this.content === '') {
      this.content = [...lines];
    } else if (typeof this.content === 'string') {
      this.content = [this.content, ...lines];
    } else {
      this.content = [...this.content, ...lines];
    }

    return this;
  }

  add(content: string, position: 'before' | 'after' = 'after'): this {
    if (typeof this.content === 'string') {
      this.toArray();
    }

    if (position === 'before') {
      this.content = [content, ...this.content];
    } else {
      this.content = [...this.content, content];
    }

    return this;
  }

  align(separator: string): this {
    if (typeof this.content === 'string') throw new Error('Not an array');

    const prefixLengths = this.content.map(
      (line) => line.split(separator)[0].length,
    );
    const prefixLongest = Math.max(...prefixLengths);

    this.content = this.content.map((line) => {
      const [prefix, ...rest] = line.split(separator);
      const padding = prefixLongest - prefix.length;

      return `${prefix}${' '.repeat(padding)}:${rest.join('')}`;
    });

    return this;
  }

  prefix(prefix: string): this {
    if (typeof this.content === 'string') {
      this.content = prefix + this.content;
    } else {
      this.content = this.content.map((line) => prefix + line);
    }

    return this;
  }

  suffix(suffix: string): this {
    if (typeof this.content === 'string') {
      this.content = this.content + suffix;
    } else {
      this.content = this.content.map((line) => line + suffix);
    }

    return this;
  }

  surround(surround: string): this {
    return this.prefix(surround).suffix(surround);
  }

  prepend(prefix: string): this {
    if (typeof this.content === 'string') {
      this.content = prefix + '\n' + this.content;
    } else {
      this.content = [prefix, ...this.content];
    }

    return this;
  }

  // this works progressively, anything before this will be ignored if not truthy
  when(condition: boolean): this {
    if (!condition) {
      if (typeof this.content === 'string') {
        this.content = '';
      } else {
        this.content = [];
      }
    }

    return this;
  }

  out(): void {
    if (typeof this.content !== 'string') {
      this.separate();
    }

    console.log(this.content);
  }
}

export function logger(initial?: string) {
  return new LoggerBuilder(initial);
}
