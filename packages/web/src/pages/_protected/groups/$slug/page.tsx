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
import { Expense, Member, Participant } from "@blank/zero";

type ParticipantWithMember = Participant & { member: Member | undefined };
export type Expenses = Expense & { participants: ParticipantWithMember[] };

function GroupRoute() {
  const expenseSheet = SearchRoute.useSearchRoute();
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  if (group.status === "not-found") {
    return <div>Group not found</div>;
  }

  return (
    <>
      <SecondaryRow className="justify-between gap-4 flex flex-col sm:flex-row sm:items-start">
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
          data={(group.data?.expenses ?? []) as Expenses[]}
        />
      </GroupBody>
      <ExpenseSheet expenses={(group.data?.expenses ?? []) as Expenses[]} />
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/")({
  component: GroupRoute,
  ssr: false,
  validateSearch: SearchRouteSchema,
});
