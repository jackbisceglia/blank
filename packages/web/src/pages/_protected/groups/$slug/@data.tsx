import {
  DeleteAllOptions as DeleteAllExpensesOptions,
  DeleteOptions as DeleteExpenseOptions,
  UpdateOptions as UpdateExpenseOptions,
} from "@/lib/mutators/expense-mutators";
import { useZero } from "@/lib/zero.provider";

export function useUpdateExpense() {
  const z = useZero();

  return (opts: UpdateExpenseOptions) => {
    return z.mutate.expense.update(opts);
  };
}

export function useDeleteExpense() {
  const z = useZero();

  return (opts: DeleteExpenseOptions) => z.mutate.expense.delete(opts);
}
export function useDeleteAllExpenses() {
  const z = useZero();

  return (opts: DeleteAllExpensesOptions) =>
    z.mutate.expense.deleteByGroupId(opts);
}
