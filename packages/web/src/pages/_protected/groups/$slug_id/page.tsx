import { createFileRoute } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { GroupBody, States } from "./layout";
import { DataTable } from "./@components/expense-table";
import {
  ExpenseSheet,
  SearchRoute as ExpenseSheetSearchRoute,
  SearchRouteSchema as ExpenseSheetSearchRouteSchema,
} from "./@expense.sheet";
import {
  SettleExpensesDialog,
  SearchRouteStep1 as SettleExpensesSearchRoute,
  SearchRouteSchema as SettleExpensesSearchRouteSchema,
} from "./@settle-dialog";
import { Expense, Member, Expense as ZeroExpense } from "@blank/zero";
import { ParticipantWithMember } from "@/lib/participants";
import * as v from "valibot";
import {
  ActiveExpensesCard,
  BalancesCard,
  CardsSection,
  ActionsCard,
} from "./@components/overview-cards";
import { TableActions } from "./@components/table-actions";
import {
  useDeleteAllExpenses,
  useExpenseListByGroupId,
  useUpdateExpense,
} from "../../@data/expenses";
import { useGroupById } from "../../@data/groups";
import { FiltersSchema } from "./@components/table-filters";
import { QuerySchema, useQueryFromSearch } from "./@components/table-query";
import { StatusSchema, useStatusFromSearch } from "./@components/table-status";
import { createBalanceMap } from "@/lib/balances";
import { slugify } from "@blank/core/lib/utils/index";

export type ExpenseWithParticipants = ZeroExpense & {
  participants: ParticipantWithMember[];
};

function useQueries(id: string, status: Expense["status"] | "all") {
  const group = useGroupById(id);
  const expenses = useExpenseListByGroupId(id, { status });

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
  const sheet = ExpenseSheetSearchRoute.useSearchRoute();
  const settle = SettleExpensesSearchRoute.useSearchRoute();
  const params = Route.useParams()["slug_id"];
  const tableQuery = useQueryFromSearch();
  const status = useStatusFromSearch();

  const query = useQueries(params.id, status.value);
  const mutate = useMutations();

  if (!query.group.data || query.group.status === "not-found") {
    return <States.NotFound title={slugify(params.slug).decode()} />;
  }

  const group = query.group.data;
  const expenses = query.expenses.data;

  const active = expenses.find((e) => e.id === sheet.state());
  const sum = expenses.reduce((sum, { amount }) => sum + amount, 0);
  const map = createBalanceMap(group.expenses as ExpenseWithParticipants[]);
  // add as property on db entity -> group.lastSettled
  const lastSettled =
    group.expenses.filter((e) => e.status === "settled" && e.createdAt).at(0)
      ?.createdAt ?? undefined;

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
            balances={map}
          />
          <ActionsCard
            members={group.members as Member[]}
            balances={map}
            lastSettled={lastSettled ? new Date(lastSettled) : undefined}
            settle={settle.open}
          />
        </CardsSection>
        <TableActions
          id={group.id}
          expenseCount={expenses.length}
          members={group.members as Member[]}
          actions={{ deleteAll: mutate.expense.deleteAll }}
        />
        <DataTable
          query={tableQuery.value ?? ""}
          expand={sheet.open}
          data={expenses as ExpenseWithParticipants[]}
          totalGroupExpenses={group.expenses.length}
          updateTitle={mutate.expense.randomizeTitle}
        />
      </GroupBody>
      {active && <ExpenseSheet expense={active as ExpenseWithParticipants} />}
      <SettleExpensesDialog
        active={group.expenses as ExpenseWithParticipants[]}
      />
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug_id/")({
  component: GroupRoute,
  search: {
    middlewares: [
      function stripEmptyArrayValues(opts) {
        const next = { ...opts.next(opts.search) };
        Object.entries(opts.search).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length === 0) {
            type K = keyof typeof next;
            const k = key as K;

            next[k] = undefined;
          }
        });
        return next;
      },
    ],
  },
  validateSearch: v.object({
    ...ExpenseSheetSearchRouteSchema.entries,
    ...SettleExpensesSearchRouteSchema.entries,
    ...QuerySchema.entries,
    ...StatusSchema.entries,
    ...FiltersSchema.entries,
  }),
});
