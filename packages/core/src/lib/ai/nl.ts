import { createSafeGenerateObject } from "./utils";
import { valibotSchema } from "@ai-sdk/valibot";
import * as v from "valibot";
import { defaults, ModelKeys, models } from "./models";
import { ResultAsync, err, ok } from "neverthrow";
import { ExpenseInsert } from "../../modules/expense/schema";
import { ParticipantInsert } from "../../modules/participant/schema";
import { fromParsed } from "../_legacy/neverthrow";
import { optional } from "../utils";

const toDecimalSplit = (split: readonly [number, number]) =>
  split[0] / split[1];

function unindent(strings: TemplateStringsArray, ...values: unknown[]) {
  const rawString = strings.reduce(
    (acc, str, i) => acc + str + ((values[i] || "") as string),
    "",
  );
  const lineIsOnlyWhitespace = (line: string) =>
    line.length !== line.trim().length;

  const lengthPostTrim = (line: string) =>
    line.length - line.trimStart().length;

  const lines = rawString.split("\n");

  const prefix = " ".repeat(
    Math.min(...lines.filter(lineIsOnlyWhitespace).map(lengthPostTrim)),
  );

  return lines.map((line) => line.replace(prefix, "")).join("\n");
}

export namespace nl {
  type ParseOptions = {
    description: string;
    images?: string[];
    models?: {
      quality?: ModelKeys;
      fast?: ModelKeys;
    };
  };

  const expenseSchema = v.omit(ExpenseInsert, [
    "groupId",
    "id",
    "createdAt",
    "date",
    "status",
  ]);

  const memberSchemaBase = v.object({
    ...v.omit(ParticipantInsert, ["expenseId", "groupId", "userId"]).entries,
    name: v.pipe(v.string(), v.minLength(1)),
    role: v.string(),
  });

  const llmSplit = v.pipe(v.array(v.number()), v.length(2));
  const mappedSplit = v.tuple([v.number(), v.number()]);

  export const expense = {
    config: {
      schema: {
        internal: v.object({
          expense: expenseSchema,
          members: v.array(
            v.object({
              ...memberSchemaBase.entries,
              split: mappedSplit,
            }),
          ),
        }),
        llm: v.object({
          expense: expenseSchema,
          members: v.array(
            v.object({
              ...memberSchemaBase.entries,
              split: llmSplit,
            }),
          ),
        }),
      },
      grounding: unindent`
        # Expense Parser

        You are an expert at parsing informal expense summaries into structured data for expense splitting applications.

        ## Input
        You'll receive natural language descriptions of expenses shared between multiple people.

        ### Image Attachments
        You will also potentially be given images of an expense. You should heavily leverage this to extract things like total value and the description, as this is a good source of truth. 


        ## Key Rules

        ### Expense Description Part 1
        - Omit member names (those go in the members array)
          - Sometimes there is the name of a thing or person who is not a member, but part of the expense itself. These should be included in the description.
        - Omit dates and times (both absolute like "June 2nd" and relative like "yesterday")
        - Remove unnecessary verbs or actions
        - Keep only the core essence of what was purchased/paid for

        ### Expense Description Part 2
        - Images can be useful and contextual, but they can also sometimes be too detailed.

        - It's important that you understand that your job is to distill the expense into a digestable description. This means that you should use signals/hints from images as a guide create a great description for the end user.
          - If the image lists 3 items, we do not want a description: 'Item A, Item B, Item C'. Instead maybe you can do something like, 'Food from Walmart', or 'Home supplies from CVS', which is more useful
        - Your responsibility is to be mindful about when to be specific and when that makes sense, and when not to be too specific. Remember descriptions should be a sentence or less ( < 64 chars )!


        ### Expense Amount
        - Always an integer in USD

        ### Members
        - If no explicit payer is mentioned, assume "USER" is the payer
        - Always include "USER" (the person initiating the expense) unless clearly excluded
        - Omit anyone with a split of 0 (unless they're the payer)
        - Total of all splits must equal 1.0
        - ALWAYS ASSUME EQUAL SPLITS WHEN NOT SPECIFIED (with 2 people, this means 0.5 each)
        - Default to equal splits when not specified
        - For each split, output the value as a tuple [numerator, denominator] representing the fraction (e.g., 1/2 as [1, 2])

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
    parse: function (options: ParseOptions) {
      const qualityModel =
        models[options.models?.quality ?? defaults.quality]();
      const fastModel = models[options.models?.fast ?? defaults.fast]();

      console.log("[quality] ", qualityModel, "[fast] ", fastModel);

      // TODO: split the context into two parts
      const fastLLMParser = createSafeGenerateObject({
        schema: valibotSchema(this.config.schema.llm),
        system: this.config.grounding,
        model: fastModel,
        ...optional({ images: options.images }),
      });
      const qualityLLMParser = createSafeGenerateObject({
        schema: valibotSchema(this.config.schema.llm),
        system: this.config.grounding,
        model: qualityModel,
        ...optional({ images: options.images }),
      });

      return ResultAsync.combine([
        fastLLMParser(`${this.config.instruction}: ${options.description}`),
        qualityLLMParser(`${this.config.instruction}: ${options.description}`),
      ])
        .map(([fast, quality]) => {
          return {
            expense: fast.object.expense,
            members: quality.object.members,
          };
        })
        .andThen((generated) =>
          fromParsed(this.config.schema.internal, generated),
        )
        .andThen((parsed) => {
          // TODO: Replace these basic validation checks with more robust validation system

          // Check: Non-zero price
          if (parsed.expense.amount <= 0) {
            return err(new Error("Expense amount must be greater than zero"));
          }

          // Check: Has a payer
          const payer = parsed.members.find(
            (member) => member.role === "payer",
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
            (sum, member) => sum + toDecimalSplit(member.split),
            0,
          );

          if (parsed.members.some(({ split }) => split[0] > split[1])) {
            return err(
              new Error(
                `All splits must be have a larger denominator than numberator`,
              ),
            );
          }

          if (Math.abs(totalSplit - 1.0) > 0.0001) {
            return err(
              new Error(
                `Member splits must add up to 1.0, got ${totalSplit.toString()}`,
              ),
            );
          }

          return ok(parsed);
        });
    },
  };
}
