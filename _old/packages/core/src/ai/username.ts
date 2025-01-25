import { llmToObject } from './core';
import prompts from './prompts';

import { z } from 'zod';

export async function generateUsername(): Promise<string> {
  try {
    const generated = await llmToObject(
      undefined,
      prompts.randomUsername(),
      z.object({
        username: z.string(),
      }),
      {},
    );

    return generated.username;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
      throw e;
    }

    throw new Error('LLM did not return an object');
    // TODO: need to handle this better, for now returning null signifies no object was generated
  }
}
