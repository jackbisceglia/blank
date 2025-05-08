import { createFileRoute, Link } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { useGetGroupBySlug } from "../@data";
import { Button } from "@/components/ui/button";
import { GroupBody, SecondaryRow } from "./layout";

function GroupRoute() {
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  if (group.status === "not-found") {
    return <div>Group not found</div>;
  }

  return (
    <>
      <SecondaryRow>
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
      </SecondaryRow>
      <GroupBody>
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
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/")({
  component: GroupRoute,
  ssr: false,
});
