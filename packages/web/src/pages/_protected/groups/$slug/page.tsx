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
import { Test } from "./@test-dialog";

export type ExpenseWithParticipants = Expense & {
  participants: ParticipantWithMember[];
};

function GroupRoute() {
  const expenseSheet = SearchRoute.useSearchRoute();
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);
  const sheet = SearchRoute.useSearchRoute();

  const active = group.data?.expenses.find((e) => e.id === sheet.state());

  if (group.status === "not-found") {
    return <div>Group not found</div>;
  }

  return (
    <>
      <SecondaryRow className="justify-between gap-4 md:gap-2 flex flex-col sm:flex-row sm:items-start">
        <SubHeading> {group.data?.description} </SubHeading>
        <Button asChild size="xs" variant="theme" className="sm:ml-auto">
          <Link
            to="."
            search={(prev) => ({
              action: ["new-expense", ...(prev.action ?? [])],
            })}
          >
            New Expense
          </Link>
        </Button>
      </SecondaryRow>
      <GroupBody>
        <DataTable
          expand={expenseSheet.open}
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
  validateSearch: SearchRouteSchema,
});
