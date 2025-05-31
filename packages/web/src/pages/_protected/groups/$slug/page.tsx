import { createFileRoute } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { useGetExpenseListByGroupSlug, useGetGroupBySlug } from "../@data";
import { GroupBody, States } from "./layout";
import { DataTable } from "./@expense-table";
import { ExpenseSheet, SearchRoute, SearchRouteSchema } from "./@expense-sheet";
import { Member, Expense as ZeroExpense } from "@blank/zero";
import { ParticipantWithMember } from "@/lib/participants";
import { useDeleteAllExpenses, useUpdateExpense } from "./@data";
import * as v from "valibot";
import { TableActions, useQueryFromSearch } from "./@expense-table-actions";
import { slugify } from "@/lib/utils";
import {
  ActiveExpensesCard,
  BalancesCard,
  CardsSection,
  SuggestionsCard,
} from "./@group-cards";

function createBalanceMap(expenses: ExpenseWithParticipants[]) {
  function initialize() {
    const map = new Map<string, number>();

    expenses.forEach((expense) => {
      expense.participants.forEach((p) => {
        const balance = map.get(p.userId) ?? 0;

        const delta = p.role === "payer" ? -1 : 1;
        const split = p.split;

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

function useQueries(slug: string, query: string | undefined) {
  const group = useGetGroupBySlug(slug);
  const expenses = useGetExpenseListByGroupSlug(slug, { query });

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
  const term = useQueryFromSearch();

  const query = useQueries(params.slug, term.value);
  const mutate = useMutations();

  if (!query.group.data || query.group.status === "not-found") {
    return <States.NotFound title={slugify(params.slug).decode()} />;
  }

  const group = query.group.data;
  const expenses = query.expenses.data;

  const active = group.expenses.find((e) => e.id === sheet.state());
  const sum = group.expenses.reduce((sum, { amount }) => sum + amount, 0);
  const map = createBalanceMap(group.expenses as ExpenseWithParticipants[]);

  return (
    <>
      <SubHeading> {group.description} </SubHeading>
      <GroupBody>
        <CardsSection>
          <ActiveExpensesCard total={sum} count={group.expenses.length} />
          <BalancesCard
            count={group.expenses.length}
            members={group.members as Member[]}
            balance={map}
          />
          <SuggestionsCard members={group.members as Member[]} balance={map} />
        </CardsSection>
        <TableActions
          id={group.id}
          expenseCount={group.expenses.length}
          actions={{ deleteAll: mutate.expense.deleteAll }}
        />
        <DataTable
          query={term.value}
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
  validateSearch: v.object({
    expense: SearchRouteSchema.entries.expense,
    query: v.optional(v.string()),
  }),
});
