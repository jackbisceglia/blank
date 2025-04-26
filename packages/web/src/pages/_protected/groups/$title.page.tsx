import { PageHeaderRow } from "@/components/layouts";
import { createFileRoute } from "@tanstack/react-router";
import { useGetGroupBySlug } from "./@data";
import { cn } from "@/lib/utils";
import { SubHeading } from "@/components/prose";
import { Skeleton } from "@/components/ui/skeleton";

// const States = {
//   Loading: () => null,
//   NotFound: (props: { title: string }) => (
//     <PrimaryHeading className="mx-auto py-12">
//       Group "{props.title}" not found
//     </PrimaryHeading>
//   ),
// };

function GroupRoute() {
  const { title: titleSlug } = Route.useParams();
  const { data } = useGetGroupBySlug({ slug: titleSlug });

  return (
    <>
      <PageHeaderRow className={cn(!data?.description && "py-1", "mb-2")}>
        {data?.description ? (
          <SubHeading> {data.description} </SubHeading>
        ) : (
          <Skeleton className="h-4 w-1/5 min-w-40 max-w-60 my-auto" />
        )}
      </PageHeaderRow>
      <div>
        {(data?.expenses ?? []).length > 0 ? (
          data?.expenses.map((expense) => {
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
  // loader: () => ({ crumb: "Dashboard" }),
});
