import { createSafeGenerateObject } from "./utils";
import { ExpenseInsert } from "../db";
import { valibotSchema } from "@ai-sdk/valibot";
import * as v from "valibot";
import { ParticipantInsert } from "../db/participant.schema";
import { DEFAULT, DEFAULT_FAST, ModelKeys, models } from "./models";
import { ResultAsync, err, ok } from "neverthrow";

function unindent(strings: TemplateStringsArray, ...values: unknown[]) {
  const rawString = strings.reduce(
    (acc, str, i) => acc + str + ((values[i] || "") as string),
    ""
  );
  const lineIsOnlyWhitespace = (line: string) =>
    line.length !== line.trim().length;

  const lengthPostTrim = (line: string) =>
    line.length - line.trimStart().length;

  const lines = rawString.split("\n");

  const prefix = " ".repeat(
    Math.min(...lines.filter(lineIsOnlyWhitespace).map(lengthPostTrim))
  );

  return lines.map((line) => line.replace(prefix, "")).join("\n");
}

export namespace nl {
  export const expense = {
    config: {
      schema: v.object({
        expense: v.omit(ExpenseInsert, ["groupId", "id", "createdAt", "date"]),
        members: v.array(
          v.object({
            ...v.omit(ParticipantInsert, ["expenseId", "groupId", "userId"])
              .entries,
            name: v.pipe(v.string(), v.minLength(1)),
            split: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
            role: v.string(),
          })
        ),
      }),
      grounding: unindent`
        # Expense Parser

        You are an expert at parsing informal expense summaries into structured data for expense splitting applications.

        ## Input
        You'll receive natural language descriptions of expenses shared between multiple people.

        ## Key Rules

        ### Expense Description
        - Omit member names (those go in the members array)
          - Sometimes there is the name of a thing or person who is not a member, but part of the expense itself. These should be included in the description.
        - Omit dates and times (both absolute like "June 2nd" and relative like "yesterday")
        - Remove unnecessary verbs or actions
        - Keep only the core essence of what was purchased/paid for

        ### Expense Amount
        - Always an integer in USD

        ### Members
        - If no explicit payer is mentioned, assume "USER" is the payer
        - Always include "USER" (the person initiating the expense) unless clearly excluded
        - Omit anyone with a split of 0 (unless they're the payer)
        - Total of all splits must equal 1.0
        - ALWAYS ASSUME EQUAL SPLITS WHEN NOT SPECIFIED (with 2 people, this means 0.5 each)
        - Default to equal splits when not specified

        ## Examples

        Input: "I paid for lunch with Jane Doe yesterday, $30"
        Output:
        \`\`\`json
        {
          "description": "Lunch",
          "amount": 30,
          "members": [
            {"name": "USER", "split": 0.5, "role": "payer"},
            {"name": "Jane Doe", "split": 0.5, "role": "participant"},
          ]
        }
        \`\`\`
      `,
      instruction: "Please parse the following summary into the given schema",
    },
    parse: function (
      description: string,
      opts?: { fastModel?: ModelKeys; qualityModel?: ModelKeys }
    ) {
      const fastModel = models[opts?.fastModel ?? DEFAULT_FAST]();
      const qualityModel = models[opts?.qualityModel ?? DEFAULT]();

      // TODO: split the context into two parts
      const fastLLMParser = createSafeGenerateObject({
        schema: valibotSchema(this.config.schema),
        system: this.config.grounding,
        model: fastModel,
      });
      const qualityLLMParser = createSafeGenerateObject({
        schema: valibotSchema(this.config.schema),
        system: this.config.grounding,
        model: qualityModel,
      });

      return ResultAsync.combine([
        fastLLMParser(`${this.config.instruction}: ${description}`),
        qualityLLMParser(`${this.config.instruction}: ${description}`),
      ])
        .map(([fast, quality]) => {
          return {
            expense: fast.object.expense,
            members: quality.object.members,
          };
        })
        .andThen((parsed) => {
          // TODO: Replace these basic validation checks with more robust validation system

          // Check: Non-zero price
          if (parsed.expense.amount <= 0) {
            return err(new Error("Expense amount must be greater than zero"));
          }

          // Check: Has a payer
          const payer = parsed.members.find(
            (member) => member.role === "payer"
          );
          if (!payer) {
            return err(new Error("Expense must have a payer"));
          }

          // Check: Has at least one member
          if (parsed.members.length === 0) {
            return err(new Error("Expense must have at least one member"));
          }

          // Check: Splits add up to 1.0 (allowing small floating point tolerance)
          const totalSplit = parsed.members.reduce(
            (sum, member) => sum + member.split,
            0
          );
          if (Math.abs(totalSplit - 1.0) > 0.0001) {
            return err(
              new Error(
                `Member splits must add up to 1.0, got ${totalSplit.toString()}`
              )
            );
          }

          return ok(parsed);
        });
    },
  };
}
