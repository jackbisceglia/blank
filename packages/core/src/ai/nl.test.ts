import { nlToParsedTransaction, TransactionParseable } from '.';
import { Transaction } from '../db';
import { constants, LLMOptions, logger, providers } from './core';

import { describe, expect, test } from 'bun:test';

type TestOptions = {
  log?: {
    description?: boolean;
  };
};

export type MockTransaction = {
  given: string;
  toMatch: TransactionParseable;
};

const newTransaction = (
  description: string,
  amount: Transaction['amount'],
  paidBy: string,
  paidFor: string[],
): TransactionParseable => ({
  description,
  amount,
  payerName: paidBy,
  payees: paidFor.map((payeeName) => ({ payeeName })),
});

// todo: update db to include multiple payees
const suite: [string, TransactionParseable][] = [
  [
    'Split coffee with Jane Doe, $18',
    newTransaction('Coffee', 18, constants.sender, ['Jane Doe']),
  ],
  [
    'Between John and I, that dinner came to $85',
    newTransaction('Dinner', 85, constants.sender, ['John']),
  ],
  [
    'Internet for January, $110. Me and Jane Doe.',
    newTransaction('Internet for January', 110, constants.sender, ['Jane Doe']),
  ],
  [
    'Grocery store this week cost 67.50. Split with John.',
    newTransaction('Grocery store', 67.5, constants.sender, ['John']),
  ],
  [
    'Movie tickets on Saturday with Jane, $30',
    newTransaction('Movie tickets', 30, constants.sender, ['Jane']),
  ],
  [
    'Cleaning supplies at Superstore with John. $22.99',
    newTransaction('Cleaning supplies', 22.99, constants.sender, ['John']),
  ],
  [
    'Utilities bill was 95.75, Jane and I.',
    newTransaction('Utilities bill', 95.75, constants.sender, ['Jane']),
  ],
  [
    'LocalMart w/ John Doe, $62',
    newTransaction('LocalMart', 62, constants.sender, ['John Doe']),
  ],
];

function testTransactionParsingPerModel(
  provider: LLMOptions['provider'],
  opts?: TestOptions,
) {
  if (opts?.log?.description) {
    console.log('testing with: ', provider);
  }

  describe.each(suite)(
    `${provider} should parse as expected`,
    async (entry, shape) => {
      const parsed = await nlToParsedTransaction(entry, provider);

      if (!parsed) {
        throw new Error('Issue parsing returned object');
      }

      if (opts?.log?.description) {
        logger()
          .separate([
            `roughly: ${shape.description}`,
            `got: ${parsed.description}`,
          ])
          .pad({ t: 1 })
          .out();
      }

      test(`Parsed should match expected when input is "${entry}"`, () => {
        const expected = {
          ...shape,
          description: expect.stringContaining(shape.description) as string,
        };

        expect(parsed).toEqual(expected);
      });

      test(`Parsed should match expected when input is "${entry}"`, () => {
        const notExpected = {
          ...shape,
          description: expect.stringContaining(constants.unrelated) as string,
        };

        expect(parsed).not.toEqual(notExpected);
      });
    },
  );
}

testTransactionParsingPerModel(providers.openai, {
  log: { description: true },
});
testTransactionParsingPerModel(providers.mistral, {
  log: { description: true },
});
