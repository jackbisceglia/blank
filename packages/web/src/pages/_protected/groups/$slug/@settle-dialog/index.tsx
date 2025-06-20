import { useState } from "react";
import { useValidateDialogProgression } from "./validate-progression";
import * as v from "valibot";
import { Step1 } from "./step-1";
import { Step2 } from "./step-2";
import { createStackableSearchRoute } from "@/lib/search-route";
import { ExpenseWithParticipants } from "../page";

export type Step = `${typeof PREFIX}-${number}`;

export const KEY = "settle" as const;

export const PREFIX = "step" as const;
export const STEP_ONE: Step = "step-1" as const;
export const STEP_TWO: Step = "step-2" as const;

export const SearchRouteStep1 = createStackableSearchRoute(KEY, STEP_ONE);
export const SearchRouteStep2 = createStackableSearchRoute(KEY, STEP_TWO);

export const SearchRouteSchema = v.object({
  [KEY]: v.optional(
    v.fallback(
      v.array(v.union([v.literal<Step>(STEP_ONE), v.literal<Step>(STEP_TWO)])),
      [STEP_TWO],
    ),
  ),
});

type SettleExpensesDialogProps = {
  active: ExpenseWithParticipants[];
};

export function SettleExpensesDialog(props: SettleExpensesDialogProps) {
  const progression = useValidateDialogProgression(props.active.length);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  const valid = progression.validate();

  if (!valid) {
    throw new Error(
      "Sorry, we couldn’t settle your expenses. Please refresh the page or try again.",
    );
  }

  return (
    <>
      <Step1
        previous={progression.getPreviousStep(1)}
        next={progression.getNextStep(1)}
        selectedExpenseIds={selectedExpenseIds}
        setSelectedExpenseIds={setSelectedExpenseIds}
      />
      <Step2
        previous={progression.getPreviousStep(2)}
        next={progression.getNextStep(2)}
        selectedExpenseIds={selectedExpenseIds}
        setSelectedExpenseIds={setSelectedExpenseIds}
      />
    </>
  );
}
