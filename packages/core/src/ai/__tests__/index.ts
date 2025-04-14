import { Eval } from "braintrust";
import { AnswerCorrectness as AnswerCorrectnessGeneric } from "autoevals";
import { JSONDiff } from "autoevals";
import { ModelKeys } from "../models";
import { nl } from "../nl";
import { data } from "./@nl.expense.dataset";

const PROJECT_BASE = "blank";

export const EXPENSE_EVAL_PROJECT = `${PROJECT_BASE}.expense.eval`;

const _tags = [
  "description.core",
  "description.omit-date-time-info",
  "description.omit-member-names",
  "description.include-names-when-not-members",
] as const;

export type EvaluationDataInput = (typeof data)[number];
export type EvaluationDataOutput = Omit<(typeof data)[number], "tags">;
export type Tag = (typeof _tags)[number];

type AnswerCorrectnessOptions<T extends object> = {
  input: string;
  output: T;
  expected?: T;
};

export function AnswerCorrectness<T extends object>(
  opts: AnswerCorrectnessOptions<T>
) {
  return AnswerCorrectnessGeneric({
    input: opts.input,
    output: JSON.stringify(opts.output).toLowerCase(),
    expected: JSON.stringify(opts.expected).toLowerCase(),
  });
}

// allow to take another scorer specific for the provided dataset (eg. test that the thing provided is happening)
export function createExpenseEvalRunner(model: ModelKeys, experiment: string) {
  return async (dataset: EvaluationDataOutput[]) => {
    if (dataset.length === 0) {
      console.warn(`No data for ${experiment}, skipping`);
      return;
    }

    return await Eval(EXPENSE_EVAL_PROJECT, {
      data: dataset,
      async task(input) {
        const res = await nl.expense.parse(input, { model });

        if (res.isErr()) {
          throw new Error("Failed to parse expense description");
        }

        return res.value.object;
      },
      scores: [JSONDiff, AnswerCorrectness],
      metadata: { model },
      experimentName: experiment,
      trialCount: 2,
    });
  };
}

export function formatDatasetByTag(dataset: EvaluationDataInput[], tag: Tag) {
  return dataset
    .filter((d) => d.tags.includes(tag))
    .map((entry) => {
      const { tags: _, ...rest } = entry;
      return rest;
    });
}
