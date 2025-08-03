import { Eval } from "braintrust";
import { AnswerCorrectness as AnswerCorrectnessGeneric } from "autoevals";
import { JSONDiff } from "autoevals";
import { ModelKeys } from "../models";
import { nl } from "../nl";
import { data } from "./@nl.expense.dataset";

type ModelDefintion = { fast: ModelKeys; quality: ModelKeys };
export const MODELS: ModelDefintion = {
  fast: "pro.qwen3",
  quality: "pro.qwen3",
} as const;

const PROJECT_BASE = "blank";

const EXPENSE_EVAL_PROJECT = `${PROJECT_BASE}.expense.eval`;

export type Tag =
  | "description.core"
  | "description.omit-date-time-info"
  | "description.omit-member-names"
  | "description.include-names-when-not-members";

type EvaluationDataInput = (typeof data)[number];
type EvaluationDataOutput = Omit<(typeof data)[number], "tags">;

type AnswerCorrectnessOptions<T extends object> = {
  input: string;
  output: T;
  expected?: T;
};

function AnswerCorrectness<T extends object>(
  opts: AnswerCorrectnessOptions<T>,
) {
  return AnswerCorrectnessGeneric({
    input: opts.input,
    output: JSON.stringify(opts.output).toLowerCase(),
    expected: JSON.stringify(opts.expected).toLowerCase(),
    context:
      "Each property in the output should match the same property in the expected output. For fields that are based in language, such as (description), the fields should be compared for similarity from a matter of semantic similarity. If the wording is different, but they convey the same message, this should be scored favorably. If the wording is not computationally too different, but the two strings mean different things, this shoudl be discouraged.",
  });
}

// allow to take another scorer specific for the provided dataset (eg. test that the thing provided is happening)
export function createExpenseEvalRunner(
  modelFast: ModelKeys,
  modelQuality: ModelKeys,
  experiment: string,
) {
  return async (dataset: EvaluationDataOutput[]) => {
    if (dataset.length === 0) {
      console.warn(`No data for ${experiment}, skipping`);
      return;
    }

    return await Eval(EXPENSE_EVAL_PROJECT, {
      data: dataset,
      async task(input) {
        const res = await nl.expense.parse({
          description: input,
          models: { fast: modelFast, quality: modelQuality },
        });

        if (res.isErr()) {
          throw new Error("Failed to parse expense description");
        }

        return res.value;
      },
      scores: [JSONDiff, AnswerCorrectness],
      metadata: { fast: modelFast, quality: modelQuality },
      experimentName: experiment,
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
