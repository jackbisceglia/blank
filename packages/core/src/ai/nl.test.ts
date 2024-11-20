import { TransactionParseable, nlToParsedTransaction } from '.';
import { Transaction } from '../db';
import {
  LLMOptions,
  LLMProviders,
  LoggerBuilder,
  constants,
  getLLMDetails,
  logger,
  models,
  providers,
} from './core';

import { AnswerSimilarity, Levenshtein } from 'autoevals';
import { describe, expect, test } from 'bun:test';

// can add different thresholds later
const THRESHOLDS = [0.8];

type TestOptions = {
  log?: boolean;
};

export type MockTransaction = {
  given: string;
  toMatch: TransactionParseable;
};

async function time<T>(fn: () => Promise<T>) {
  const start = performance.now();
  const data = await fn();
  const end = performance.now();

  return {
    data,
    duration: end - start,
  };
}

const judgePrompts = {
  description: (entry: string) => {
    return [
      'Parse the description out of the given transaction description, using the following rules:',
      '- Remove timing/dates, locations, vendor names, payment methods, and transaction verbs (e.g., bought, paid, split).',
      '- Remove participant names if they are captured in payees.',
      '- Include names if they are not involved in the purchase itself (e.g., a birthday gift recipient).',
      '- Remove words that describe the process of buying rather than the subject of the transaction.',
      '- Always preserve identifying details (e.g., "Bob\'s birthday gift").',
      "- Don't modify unique transaction source identifiers.",
      '- For recurring expenses, include timing information if provided and relevant.',
      '- IMPORTANT: Do not categorize or generalize specific transaction details. For example, do not change "Starbucks" to "coffee".',
      '',
      `Transaction: ${entry}`,
    ].join('\n');
  },
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
const suite: [string, TransactionParseable, `TODO: ${string}`?][] = [
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
    newTransaction('Utilities', 95.75, constants.sender, ['Jane']),
  ],
  [
    'LocalMart w/ John Doe, $62',
    newTransaction('LocalMart', 62, constants.sender, ['John Doe']),
  ],
  [
    'Dinner with Jane, $67',
    newTransaction('Dinner', 67, constants.sender, ['Jane']),
  ],
  [
    'Celtics tickets with John Doe, $100',
    newTransaction('Celtics tickets', 100, constants.sender, ['John Doe']),
  ],
  [
    'Got Annie a haircut, split with Jane Doe, $71',
    newTransaction('Annie haircut', 71, constants.sender, ['Jane Doe']),
  ],
  [
    'Split beans and coffee with Jane Doe, $29.88',
    newTransaction('Beans and coffee', 29.88, constants.sender, ['Jane Doe']),
  ],
];

function testGeneralTransactionParsing(llms: LLMOptions[], opts?: TestOptions) {
  const formattedLLMSuite = llms.map((llm) => {
    const { provider, model } = getLLMDetails(llm);

    return [provider, model, llm] as const;
  });

  describe.each(formattedLLMSuite)('%s %s', (_provider, _model, llm) => {
    describe.each(suite)(`General Parsing`, async (entry, shape, todo) => {
      const { data: parsed } = await time(async () => {
        return await nlToParsedTransaction(entry, { llm });
      });

      if (!parsed) {
        throw new Error('Issue parsing returned object');
      }

      if (todo) {
        test.todo(`${todo} -- ${entry}`);
      } else {
        test(`Parsed (excl. description) should match expected when input is "${entry}"`, () => {
          const expected = { ...shape, description: null };
          const parsedRelevant = { ...parsed, description: null };

          const logObject = (logger: LoggerBuilder, name: string) => {
            logger
              .prefix('> ')
              .prefix('  ')
              .align(':')
              .add(`  ${name}`, 'before')
              .pad({ t: 1 })
              .when(false)
              .out();
          };

          logObject(
            logger().lines([
              `Amount: ${shape.amount.toFixed(2)}`,
              `Payer: ${shape.payerName}`,
              `Payees: ${shape.payees.map((p) => p.payeeName).join(', ')}`,
            ]),
            'Expected',
          );

          logObject(
            logger().lines([
              `Amount: ${parsed.amount.toFixed(2)}`,
              `Payer: ${parsed.payerName}`,
              `Payees: ${parsed.payees.map((p) => p.payeeName).join(', ')}`,
            ]),
            'Parsed',
          );

          expect(
            parsedRelevant,
            [
              `Exp: ${JSON.stringify(expected, null, 2)}`,
              `Got: ${JSON.stringify(parsedRelevant, null, 2)}`,
            ].join('\n'),
          ).toEqual(expected);
        });

        const LLMScorers = ['AnswerSimilarity'];
        describe.each(
          ([Levenshtein, AnswerSimilarity] as const).map((f) => [f.name, f]),
        )('Scorer: %s', (scorerName, scorer) => {
          test.each(THRESHOLDS.map((t) => [t, shape.description]))(
            'Parsed description should have > %p when expected is %s',
            async (threshold) => {
              const aiConfig = {
                useCoT: true,
                openAiApiKey: process.env.OPENAI_API_KEY,
              };
              const isLLMScorer = LLMScorers.includes(scorerName);

              const result = await scorer({
                input: judgePrompts.description(entry),
                output: parsed.description,
                expected: shape.description,
                ...(isLLMScorer ? { ...aiConfig } : {}),
              });

              const similarity = result.score ?? 0;

              logger()
                .lines([
                  `Similarity: ${similarity.toFixed(2)}`,
                  `Expected: ${shape.description}`,
                  `Got: ${parsed.description}`,
                ])
                .prefix('  > ')
                .align(':')
                .add(scorerName, 'before')
                .pad({ t: 1 })
                .when(!!opts?.log)
                .out();

              expect(
                similarity,
                `Similarity: ${similarity.toFixed(2)}, Expected: ${shape.description}, Got: ${parsed.description}`,
              ).toBeGreaterThanOrEqual(threshold);
            },
          );
        });
      }
    });
  });
}

const config: {
  llms: LLMProviders[];
  opts?: TestOptions;
} = {
  llms: [
    { provider: providers.anthropic, model: models.anthropic.default },
    { provider: providers.openai, model: models.openai.default },
    // { provider: providers.mistral, model: models.mistral.default },
  ],
  opts: { log: false },
};

testGeneralTransactionParsing(config.llms, config.opts);
