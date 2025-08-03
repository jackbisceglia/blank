import { useListQuery, ZERO_CACHE_DEFAULT } from "@/lib/zero";
import {
  DeleteAllOptions as DeleteAllExpensesOptions,
  DeleteOptions as DeleteExpenseOptions,
  UpdateOptions as UpdateExpenseOptions,
  BulkSettleOptions as BulkSettleExpensesOptions,
} from "@/lib/client-mutators/expense-mutators";
import { useZero } from "@/lib/zero";
import { createFromDescriptionServerFn } from "@/server/expense.route";
import { Expense } from "@blank/zero";

export function useExpenseListByGroupId(
  id: string,
  options?: { status?: Expense["status"] | "all" },
) {
  const z = useZero();
  let query = z.query.expense
    .whereExists("group", (g) => g.where("id", id))
    .orderBy("date", "desc")
    .related("participants", (p) => p.related("member").related("member"));

  if (options?.status !== "all") {
    query = query.where("status", options?.status ?? "active");
  }

  return useListQuery(query, ZERO_CACHE_DEFAULT);
}

export function useCreateExpense(groupId: string | undefined) {
  return async (description: string, images?: string[]) => {
    if (!groupId) {
      throw new Error("Could not find group to insert");
    }

    const result = await createFromDescriptionServerFn({
      data: { description, groupId: groupId, images: images ?? [] },
    });

    return { ...result, group: { id: groupId } };
  };
}

export function useUpdateExpense() {
  const z = useZero();

  return (opts: UpdateExpenseOptions) => {
    return z.mutate.expense.update(opts).client;
  };
}

export function useDeleteOneExpense() {
  const z = useZero();

  return (opts: DeleteExpenseOptions) => z.mutate.expense.delete(opts).client;
}

export function useDeleteAllExpenses() {
  const z = useZero();

  return (opts: DeleteAllExpensesOptions) =>
    z.mutate.expense.deleteByGroupId(opts).client;
}

export function useBulkSettleExpenses() {
  const z = useZero();

  return (opts: BulkSettleExpensesOptions) =>
    z.mutate.expense.bulkSettle(opts).client;
}
