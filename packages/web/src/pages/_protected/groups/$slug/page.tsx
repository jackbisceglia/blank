import { createFileRoute } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { GroupBody, States } from "./layout";
import { DataTable } from "./@components/expense-table";
import { ExpenseSheet, SearchRoute, SearchRouteSchema } from "./@expense.sheet";
import { Expense, Member, Expense as ZeroExpense } from "@blank/zero";
import { ParticipantWithMember } from "@/lib/participants";
import * as v from "valibot";
import { slugify } from "@/lib/utils";
import {
  ActiveExpensesCard,
  BalancesCard,
  CardsSection,
  SuggestionsCard,
} from "./@components/overview-cards";
import { TableActions } from "./@components/table-actions";
import {
  useDeleteAllExpenses,
  useExpenseListByGroupSlug,
  useUpdateExpense,
} from "../../@data/expenses";
import { useGroupBySlug } from "../../@data/groups";
import { FiltersSchema } from "./@components/table-filters";
import { QuerySchema, useQueryFromSearch } from "./@components/table-query";
import {
  Status,
  StatusSchema,
  useStatusFromSearch,
} from "./@components/table-status";

function createBalanceMap(expenses: ExpenseWithParticipants[]) {
  function initialize() {
    const map = new Map<string, number>();

    expenses.forEach((expense) => {
      expense.participants.forEach((p) => {
        const balance = map.get(p.userId) ?? 0;

        // split: owed = (1 - split) * amount, owe = (split) * amount
        // delta: owed = positive (they're owed), owe = negative (they owe)
        const [split, delta] =
          p.role === "payer" ? [1 - p.split, 1] : [p.split, -1];

        // For each participant, update their balance:
        //   - If payer: add their share of the amount they are owed (positive)
        //   - If not payer: subtract the share they owe (negative)
        //   - Formula: balance += delta (direction) * split (share) * amount
        map.set(p.userId, balance + delta * split * expense.amount);
      });
    });

    return map;
  }

  const balances = initialize();

  return (id: string) => balances.get(id) ?? 0;
}

export type ExpenseWithParticipants = ZeroExpense & {
  participants: ParticipantWithMember[];
};

function useQueries(slug: string, status: Expense["status"] | "all") {
  const group = useGroupBySlug(slug);
  const expenses = useExpenseListByGroupSlug(slug, { status });

  return { group, expenses };
}

function useMutations() {
  const deleteAllExpenses = useDeleteAllExpenses();
  const updateExpense = useUpdateExpense();
  function randomizeExpenseTitle(id: string) {
    void updateExpense({
      expenseId: id,
      updates: {
        expense: {
          description: Math.random().toString(36).substring(2, 15),
        },
      },
    });
  }

  return {
    expense: {
      deleteAll: deleteAllExpenses,
      update: updateExpense,
      randomizeTitle: randomizeExpenseTitle,
    },
  };
}

function GroupRoute() {
  const sheet = SearchRoute.useSearchRoute();
  const params = Route.useParams();
  const tableQuery = useQueryFromSearch();
  const status = useStatusFromSearch();

  const query = useQueries(params.slug, status.value);
  const mutate = useMutations();

  if (!query.group.data || query.group.status === "not-found") {
    return <States.NotFound title={slugify(params.slug).decode()} />;
  }

  const group = query.group.data;
  const expenses = query.expenses.data;

  const active = expenses.find((e) => e.id === sheet.state());
  const sum = expenses.reduce((sum, { amount }) => sum + amount, 0);
  const map = createBalanceMap(group.expenses as ExpenseWithParticipants[]);

  return (
    <>
      <SubHeading> {group.description} </SubHeading>
      <GroupBody>
        <CardsSection>
          <ActiveExpensesCard
            total={sum}
            count={expenses.length}
            status={status.value}
          />
          <BalancesCard
            count={expenses.length}
            members={group.members as Member[]}
            balance={map}
          />
          <SuggestionsCard members={group.members as Member[]} balance={map} />
        </CardsSection>
        <TableActions
          id={group.id}
          expenseCount={group.expenses.length}
          members={group.members as Member[]}
          actions={{ deleteAll: mutate.expense.deleteAll }}
        />
        <DataTable
          query={tableQuery.value ?? ""}
          expand={sheet.open}
          data={expenses as ExpenseWithParticipants[]}
          updateTitle={mutate.expense.randomizeTitle}
        />
      </GroupBody>
      {active && <ExpenseSheet expense={active as ExpenseWithParticipants} />}
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/")({
  component: GroupRoute,
  ssr: false,
  search: {
    middlewares: [
      function stripEmptyArrayValues(opts) {
        const next = { ...opts.next(opts.search) };
        Object.entries(opts.search).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length === 0) {
            next[key as keyof typeof next] = undefined;
          }
        });
        return next;
      },
    ],
  },
  validateSearch: v.object({
    expense: SearchRouteSchema.entries.expense,
    ...QuerySchema.entries,
    ...StatusSchema.entries,
    ...FiltersSchema.entries,
  }),
});
