import { useState } from "react";
import { ExpenseWithParticipants } from "../page";
import { useValidateDialogProgression } from "./validate-progression";
import { Step1 } from "./step-1";
import { Step2 } from "./step-2";

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
