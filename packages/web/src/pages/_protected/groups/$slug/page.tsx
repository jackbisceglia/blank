import { createFileRoute, Link } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { useGetGroupBySlug } from "../@data";
import { Button } from "@/components/ui/button";
import { GroupBody, SecondaryRow } from "./layout";
import { DataTable } from "./@expense-table";
import {
  ExpenseSheet,
  SearchRoute,
  SearchRouteSchema,
} from "./@expense-details-sheet";
import { Expense } from "@blank/zero";
import { ParticipantWithMember } from "@/lib/participants";
import { useDeleteAllExpenses, useUpdateExpense } from "./@data";
import { flags } from "@/lib/utils";
import * as v from "valibot";
import { Input } from "@/components/ui/input";

export type ExpenseWithParticipants = Expense & {
  participants: ParticipantWithMember[];
};

function useQueryFromSearch() {
  const navigate = Route.useNavigate();
  const value = Route.useSearch({
    select: (state) => state.query,
  });

  function set(value: string) {
    void navigate({
      search: (prev) => ({
        ...prev,
        query: value.length > 0 ? value : undefined,
      }),
    });
  }

  return { value, set };
}

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

  if (group.status === "not-found") {
    return <div>Group not found</div>;
  }

  return (
    <>
      {/* <SecondaryRow className="justify-between gap-4 md:gap-2 flex flex-col sm:flex-row sm:items-start"> */}
      <SubHeading> {group.data?.description} </SubHeading>
      {/* </SecondaryRow> */}

      <GroupBody>
        <SecondaryRow className="justify-between gap-4 md:gap-1 flex flex-col sm:flex-row sm:items-center">
          <Input
            className="max-w-72 placeholder:lowercase py-0 h-full py-1.5 bg-transparent placeholder:text-secondary-foreground/50 border-border border-1"
            placeholder="Search expenses..."
            value={query.value ?? ""}
            onChange={(e) => {
              query.set(e.target.value);
            }}
          />
          <Button asChild size="xs" variant="theme" className="ml-auto">
            <Link
              to="."
              search={(prev) => ({
                action: ["new-expense", ...(prev.action ?? [])],
              })}
            >
              Create
            </Link>
          </Button>
          {flags.dev.deleteAllExpenses && (
            <Button
              onClick={() => {
                void deleteAllExpenses({ groupId: group.data?.id ?? "" });
              }}
              variant="secondary"
              size="xs"
              className="ml-2 "
            >
              DELETE
            </Button>
          )}
        </SecondaryRow>
        <DataTable
          query={query.value}
          expand={sheet.open}
          updateTitle={(id) => void randomTitle(id)}
          data={(group.data?.expenses ?? []) as ExpenseWithParticipants[]}
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
