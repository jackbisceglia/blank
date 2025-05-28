import { createFileRoute, Link } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { useGetGroupBySlug } from "../@data";
import { Button } from "@/components/ui/button";
import { GroupBody, SecondaryRow, States } from "./layout";
import { DataTable } from "./@expense-table";
import {
  ExpenseSheet,
  SearchRoute,
  SearchRouteSchema,
} from "./@expense-details-sheet";
import { Expense } from "@blank/zero";
import { ParticipantWithMember } from "@/lib/participants";
import { useDeleteAllExpenses, useUpdateExpense } from "./@data";
import * as v from "valibot";
import { TableActions, useQueryFromSearch } from "./@table-actions";
import { slugify } from "@/lib/utils";

export type ExpenseWithParticipants = Expense & {
  participants: ParticipantWithMember[];
};

function GroupRoute() {
  const sheet = SearchRoute.useSearchRoute();
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);
  const deleteAllExpenses = useDeleteAllExpenses();
  const updateExpense = useUpdateExpense();

  const query = useQueryFromSearch();

  const randomTitle = (id: string) => {
    return updateExpense({
      expenseId: id,
      updates: {
        expense: {
          description: Math.random().toString(36).substring(2, 15),
        },
      },
    });
  };

  const active = group.data?.expenses.find((e) => e.id === sheet.state());

  const NotFound = () => (
    <States.NotFound title={slugify(params.slug).decode()} />
  );

  if (!group.data) return <NotFound />;
  if (group.status === "not-found") return <NotFound />;

  return (
    <>
      <SubHeading> {group.data.description} </SubHeading>

      <GroupBody>
        <TableActions
          actions={{
            deleteAll: () =>
              deleteAllExpenses({ groupId: group.data?.id ?? "" }),
          }}
        />
        <DataTable
          query={query.value}
          expand={sheet.open}
          updateTitle={(id) => void randomTitle(id)}
          data={group.data.expenses as ExpenseWithParticipants[]}
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
