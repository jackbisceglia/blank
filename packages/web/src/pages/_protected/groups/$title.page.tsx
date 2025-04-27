import { PageHeaderRow } from "@/components/layouts";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SubHeading } from "@/components/prose";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetGroup } from "./@data";

function GroupRoute() {
  const params = Route.useParams();
  const group = useGetGroup(params.title, "slug");

  return (
    <>
      <PageHeaderRow className={cn(!group.data?.description && "py-1", "mb-2")}>
        {group.data?.description ? (
          <SubHeading> {group.data.description} </SubHeading>
        ) : (
          <Skeleton className="h-4 w-1/5 min-w-40 max-w-60 my-auto" />
        )}
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

export const Route = createFileRoute("/_protected/groups/$title/")({
  component: GroupRoute,
  ssr: false,
});
