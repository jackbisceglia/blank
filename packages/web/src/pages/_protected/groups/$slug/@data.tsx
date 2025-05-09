import { DeleteExpenseOptions } from "@/lib/data.mutators";
import { useZero } from "@/lib/zero.provider";

export function useDeleteExpense() {
  const z = useZero();

  return (options: DeleteExpenseOptions) => z.mutate.expense.delete(options);
}
