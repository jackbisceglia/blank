import { createSafeGenerateObject } from "./utils";
import { ExpenseInsert } from "../db";
import { valibotSchema } from "@ai-sdk/valibot";
import * as v from "valibot";
import { ExpenseMemberInsert } from "../db/expense-member.schema";
import { ModelKeys, models } from "./models";

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
            ...v.omit(ExpenseMemberInsert, ["expenseId", "groupId", "userId"])
              .entries,
            name: v.pipe(v.string(), v.minLength(1)),
            split: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
            role: v.string(),
          })
        ),
      }),
      grounding: unindent`
        You are an expert at parsing summaries of expenses which are to be split beetween multiple people

        You will be given a summary of an expense, and your job is to parse it into the given schema such that transformation of the natural language summary into the structured schema losslessly represents the original intent and essence

        These summaries given can be typically of loose and inconsistent structure/format

        In most situations, the summary will contain in it all of the fields required in order to parse into the given  
        schema, though the various details may be present in a variety of orders or positions.

        Here are rules to follow when formatting the resulting properties

        expense.description:
        - members of the expense should be omitted from this field. these are parsed into the \`members\` array
        - keep in mind, the mention of a person may not ALWAYS be a member. 
          - if the person mentioned is a member, omit the name as they'll be included in the \`members\` array
          - if the person mentioned is not a member, you should include this data as it may truly be part of the summary
        - must include information such that the data is represented only in this field and does not overlap with other properties
        - describes only the essence of the expense, not any actions taken or other unnecessary details (eg. leading verbs)
        - must omit date and time information, both absolute and relative. eg. relative 'yesterday', 'the other day', and absolute: 'June 2nd', should be omitted
        - must be concise and honors the intent of the expense as described in the summary

        expense.amount:
        - must be an integer for now (will change in the future)
        - uses USD as currency (for now)

        member:
        - in most cases, the 'USER' member is not explicitly mentioned, but you must assume that 'USER' is a member of the expense that initiated this summary
        - if dealing with an identified member with a split of 0, then they should not be included in the \`members\` array. consider if instead they are actually a subject of the expense and should be part of the description

        member.split:
        - represents a percentage of the total expense owed
        - when no split is specified, assume that it is an even split between all members (eg. expense.amount / members.length)
        - when a split is specified, the sum of all splits must equal 1

        member.role:
        - if this member is implied to be the payer, or is explicitly stated to be the payer, then consider this member to have the role 'payer'
        - if this member is not the payer, then consider this member to have the role 'participant'
        - remember, in cases where there is no clear mention of who paid, you should assume that the 'payer' is the person who initiated the summary ('USER')

        member.name:
        - this is either a person referenced in the summary, or the person who initiated the summary
        - when it is the a person referenced, use the name that is referenced
        - when it is the source of the summary, use the term 'USER'
        `,
      instruction: "Please parse the following summary into the given schema",
    },
    parse: function (description: string, opts?: { model?: ModelKeys }) {
      const llmParser = createSafeGenerateObject({
        schema: valibotSchema(this.config.schema),
        system: this.config.grounding,
        model: opts?.model ? models[opts.model]() : undefined,
      });

      return llmParser(`${this.config.instruction}: ${description}`);
    },
  };
}
