import { useListQuery, ZERO_CACHE_DEFAULT } from "@/lib/zero";
import {
  DeleteAllOptions as DeleteAllExpensesOptions,
  DeleteOptions as DeleteExpenseOptions,
  UpdateOptions as UpdateExpenseOptions,
} from "@/lib/mutators/expense-mutators";
import { useZero } from "@/lib/zero";
import { useAuthentication } from "@/lib/authentication";
import { useParams } from "@tanstack/react-router";
import { useGroupBySlug } from "./groups";
import { useUserPreferences } from "./users";
import { createFromDescriptionServerFn } from "@/server/expense.route";

export function useExpenseListByGroupSlug(
  slug: string,
  filters?: {
    query?: string;
  }
) {
  const z = useZero();
  let query = z.query.expense
    .whereExists("group", (g) => g.where("slug", slug))
    .orderBy("date", "desc")
    .related("participants", (p) => p.related("member").related("member"));

  if (filters?.query) {
    query = query.where("description", "ILIKE", `%${filters.query}%`);
  }

  return useListQuery(query, ZERO_CACHE_DEFAULT);
}

export function useCreateExpense() {
  const auth = useAuthentication();
  const { slug } = useParams({ strict: false });
  const group = useGroupBySlug(slug ?? "");
  const userPreferences = useUserPreferences(auth.user.id);
  const groupId = group.data?.id ?? userPreferences.data?.defaultGroupId;

  return (description: string) => {
    if (!groupId) {
      const message =
        group.data?.id && userPreferences.data?.defaultGroupId
          ? "No default group found"
          : "Could not find group to insert";

      throw new Error(message);
    }

    return createFromDescriptionServerFn({ data: { description, groupId } });
  };
}

export function useUpdateExpense() {
  const z = useZero();

  return (opts: UpdateExpenseOptions) => {
    return z.mutate.expense.update(opts);
  };
}

export function useDeleteOneExpense() {
  const z = useZero();

  return (opts: DeleteExpenseOptions) => z.mutate.expense.delete(opts);
}

export function useDeleteAllExpenses() {
  const z = useZero();

  return (opts: DeleteAllExpensesOptions) =>
    z.mutate.expense.deleteByGroupId(opts);
}
