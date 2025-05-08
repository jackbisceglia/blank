import { createSafeGenerateObject } from "./utils";
import { ExpenseInsert } from "../db";
import { valibotSchema } from "@ai-sdk/valibot";
import * as v from "valibot";
import { ParticipantInsert } from "../db/participant.schema";
import { DEFAULT, DEFAULT_FAST, ModelKeys, models } from "./models";
import { ResultAsync } from "neverthrow";

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
        - Always include "USER" (the person initiating the expense) unless clearly excluded
        - Omit anyone with a split of 0 (unless they're the payer)
        - If no explicit payer is mentioned, assume "USER" is the payer
        - Total of all splits must equal 1.0
        - Default to equal splits when not specified

        ## Examples

        Input: "I paid for lunch with Sarah and Tom yesterday, $30"
        Output:
        \`\`\`json
        {
          "description": "Lunch",
          "amount": 30,
          "members": [
            {"name": "USER", "split": 0.33, "role": "payer"},
            {"name": "Sarah", "split": 0.33, "role": "participant"},
            {"name": "Tom", "split": 0.34, "role": "participant"}
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
      ]).map(([fast, quality]) => {
        return {
          expense: fast.object.expense,
          members: quality.object.members,
        };
      });
    },
  };
}
