import { createFileRoute, Link } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { useGetGroupBySlug } from "../@data";
import { Button } from "@/components/ui/button";
import { GroupBody, SecondaryRow } from "./layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthentication } from "@/lib/auth.provider";
import { useDeleteExpense } from "./@data";

function GroupRoute() {
  const auth = useAuthentication();
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  const deleteExpense = useDeleteExpense();

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
          <div className="grid grid-cols-2 gap-4">
            {group.data?.expenses.map((expense) => {
              const payer = expense.participants.find(
                (p) => p.role === "payer"
              );
              const participants = expense.participants.filter(
                (p) => p.role === "participant"
              );
              return (
                <Card key={expense.id} className="border-muted-alt">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-base font-medium">
                        {expense.description}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="theme"
                          className="shrink-0 text-sm px-2 py-1"
                        >
                          ${expense.amount}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            void deleteExpense({ expenseId: expense.id });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex flex-col gap-3">
                      <CardDescription className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground lowercase">
                          Paid by
                        </span>
                        {payer && payer.member ? (
                          <span className="text-foreground font-medium uppercase">
                            {payer.member.userId === auth.user.id
                              ? "You"
                              : payer.member.nickname}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">unknown</span>
                        )}
                      </CardDescription>
                      {participants.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {participants.map((p) => (
                            <Badge
                              key={p.member?.userId}
                              variant="secondary"
                              className="text-sm px-2 py-0.5"
                            >
                              {p.member?.nickname}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No expenses found</p>
        )}
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/")({
  component: GroupRoute,
  ssr: false,
});
