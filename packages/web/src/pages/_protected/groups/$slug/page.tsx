import { createFileRoute, Link } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { useGetGroupBySlug } from "../@data";
import { Button } from "@/components/ui/button";
import { GroupBody, SecondaryRow } from "./layout";
import { Columns, DataTable } from "./@expense-table";

function GroupRoute() {
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  if (group.status === "not-found") {
    return <div>Group not found</div>;
  }

  return (
    <>
      <SecondaryRow className="justify-between gap-3">
        <SubHeading> {group.data?.description} </SubHeading>
        <Button asChild size="xs" variant="theme" className="ml-auto">
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
        <DataTable data={(group.data?.expenses ?? []) as Columns[]} />
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/")({
  component: GroupRoute,
  ssr: false,
});
