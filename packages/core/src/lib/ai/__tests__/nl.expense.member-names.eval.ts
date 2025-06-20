import { data } from "./@nl.expense.dataset";
import { createExpenseEvalRunner, formatDatasetByTag, MODELS, Tag } from ".";

const TAG: Tag = "description.omit-member-names";

const EXPERIMENT = `${TAG}.${Date.now().toString()}`;

const evaluate = createExpenseEvalRunner(
  MODELS.fast,
  MODELS.quality,
  EXPERIMENT,
);

const dataset = formatDatasetByTag(data, TAG);

void evaluate(dataset);
