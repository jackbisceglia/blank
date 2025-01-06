import { TransactionInsert } from '../db/transaction.schema';
import { LLMOptions, llmToObject } from './core';
import prompts from './prompts';

import { z } from 'zod';

/* 
  we need to transform the TransactionInsert schema a little
  -> the llm doesn't have enough info to fill certain details that we will transform later
*/
const TransactionParseable = TransactionInsert.pick({
  description: true,
  amount: true,
}).extend({
  payerName: z.string(),
  transactionMembers: z
    .object({
      transactionMemberName: z.string(),
    })
    .array(),
});

export type TransactionParseable = z.infer<typeof TransactionParseable>;

export async function nlToParsedTransaction(
  input: string,
  opts?: {
    llm?: LLMOptions;
  },
) {
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
