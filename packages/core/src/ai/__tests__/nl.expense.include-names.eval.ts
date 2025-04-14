import { data } from "./@nl.expense.dataset";
import { createExpenseEvalRunner, formatDatasetByTag, Tag } from ".";
import { ModelKeys } from "../models";

const TAG: Tag = "description.include-names-when-not-members";

const MODEL: ModelKeys = "gpt-4o";
const EXPERIMENT = `${TAG}.${Date.now().toString()}`;

const evaluate = createExpenseEvalRunner(MODEL, EXPERIMENT);

const dataset = formatDatasetByTag(data, TAG);

void evaluate(dataset);
