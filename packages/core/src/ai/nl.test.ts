import { describe, expect, test } from "bun:test";
import { Transaction } from "../db";
import { constants, LLMOptions, providers } from "./core";
import { nl, TransactionParseable } from ".";

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
  amount: Transaction["amount"],
  paidBy: string,
  paidFor: string[],
): TransactionParseable => ({
  description,
  amount,
  payerName: paidBy, //
  payees: paidFor.map((payeeName) => ({ payeeName })),
});

// todo: update db to include multiple payees
export const mockTransactions: MockTransaction[] = [
  {
    given: "Split coffee with Jane Doe, $18",
    toMatch: newTransaction("Coffee", 18, constants.sender, ["Jane Doe"]),
  },
  {
    given: "Between John and I, that dinner came to $85",
    toMatch: newTransaction("Dinner", 85, constants.sender, ["John"]),
  },
  {
    given: "Internet for January, $110. Me and Jane Doe.",
    toMatch: newTransaction("Internet for January", 110, constants.sender, [
      "Jane Doe",
    ]),
  },
  {
    given: "Grocery store this week cost 67.50. Split with John.",
    toMatch: newTransaction("Grocery store", 67.5, constants.sender, ["John"]),
  },
  {
    given: "Movie tickets on Saturday with Jane, $30",
    toMatch: newTransaction("Movie tickets", 30, constants.sender, ["Jane"]),
  },
  {
    given: "Cleaning supplies at Superstore with John. $22.99",
    toMatch: newTransaction("Cleaning supplies", 22.99, constants.sender, [
      "John",
    ]),
  },
  {
    given: "Utilities bill was 95.75, Jane and I.",
    toMatch: newTransaction("Utilities bill", 95.75, constants.sender, [
      "Jane",
    ]),
  },
  {
    given: "LocalMart w/ John Doe, $62",
    toMatch: newTransaction("LocalMart", 62, constants.sender, ["John Doe"]),
  },
];

const suite = mockTransactions;

function testTransactionParsingPerModel(
  provider: LLMOptions["provider"],
  opts?: TestOptions,
) {
  describe.each(suite.map((s) => [s.given, s.toMatch]))(
    `${provider} should parse as expected`,
    async (given, toMatch) => {
      const parsed = await nl.toTransaction(given, provider);

      if (!parsed) {
        throw new Error("Issue parsing returned object");
      }

      if (opts?.log?.description) {
        console.log("roughly: ", toMatch.description);
        console.log("got: ", parsed.description);
        console.log("\n");
      }

      test(`Parsed should match expected when input is "${given}"`, async () => {
        const expected = {
          ...toMatch,
          description: expect.stringContaining(toMatch.description),
        };

        expect(parsed).toEqual(expected);
      });

      test(`Parsed should match expected when input is "${given}"`, async () => {
        const notExpected = {
          ...toMatch,
          description: expect.stringContaining(constants.unrelated),
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
