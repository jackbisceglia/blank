import { PageHeaderRow } from "@/components/layouts";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SubHeading } from "@/components/prose";
import { useGetGroupBySlug } from "../@data";
import { Button } from "@/components/ui/button";

function GroupRoute() {
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  if (group.status === "not-found") {
    return <div>Group not found</div>;
  }

  return (
    <>
      <PageHeaderRow className={cn("mb-2")}>
        <SubHeading> {group.data?.description} </SubHeading>
        <Button asChild size="sm" variant="theme" className="ml-auto">
          <Link
            to="."
            search={(prev) => ({
              action: ["new-expense", ...(prev.action ?? [])],
            })}
          >
            New Expense
          </Link>
        </Button>
      </PageHeaderRow>
      <div>
        {(group.data?.expenses ?? []).length > 0 ? (
          group.data?.expenses.map((expense) => {
            return (
              <div key={expense.id}>
                <h3>{expense.description}</h3>
                <p>{expense.amount}</p>
              </div>
            );
          })
        ) : (
          <p>No expenses found</p>
        )}
      </div>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/")({
  component: GroupRoute,
  ssr: false,
});
