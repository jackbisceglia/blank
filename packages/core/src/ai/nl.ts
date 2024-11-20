import { PayeeInsert, TransactionInsert } from '../db/transaction.schema';
import { LLMOptions, llmToObject } from './core';
import prompts from './prompts';

import { z } from 'zod';

/* 
  we need to transform the TransactionInsert schema a little
  -> the llm doesn't have enough info to fill certain details that we will transform later
*/
export const TransactionParseable = TransactionInsert.omit({
  id: true,
  date: true,
  payerId: true,
}).extend({
  payerName: z.string(), // TODO: add some validation boundaries
  payees: PayeeInsert.omit({
    payeeId: true,
    transactionId: true,
  })
    .extend({
      payeeName: z.string(), // TODO: add some validation boundaries
    })
    .array(),
});

export type TransactionParseable = z.infer<typeof TransactionParseable>;

// module for parsing natural language queries into data entities
export async function nlToParsedTransaction(
  input: string,
  opts?: {
    llm?: LLMOptions;
  },
): Promise<TransactionParseable | null> {
  try {
    const transaction = await llmToObject(
      prompts.nlToTransaction(),
      input,
      TransactionParseable,
      {
        llm: opts?.llm,
      },
    );

    return transaction;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    }
    // TODO: need to handle this better, for now returning null signifies no object was generated
    return null;
  }
}
