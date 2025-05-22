import {
  DeleteAllExpensesOptions,
  DeleteExpenseOptions,
} from "@/lib/data.mutators";
import { useZero } from "@/lib/zero.provider";

export function useDeleteExpense() {
  const z = useZero();

  return (opts: DeleteExpenseOptions) => z.mutate.expense.delete(opts);
}
export function useDeleteAllExpenses() {
  const z = useZero();

  return (opts: DeleteAllExpensesOptions) => z.mutate.expense.deleteAll(opts);
}
