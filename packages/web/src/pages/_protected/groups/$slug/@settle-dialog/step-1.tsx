import { PropsWithChildren } from "react";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { useExpenseListByGroupSlug } from "@/pages/_protected/@data/expenses";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchRouteStep1 } from ".";
import { Route } from "../page";

type Step1Props = PropsWithChildren<{
  previous: () => void;
  next: () => void;
  selectedExpenseIds: string[];
  setSelectedExpenseIds: (ids: (previous: string[]) => string[]) => void;
}>;

export function Step1(props: Step1Props) {
  const params = Route.useParams();
  const route = SearchRouteStep1.useSearchRoute({
    hooks: {
      onOpen: () => selectAll(),
    },
  });

  const expenses = useExpenseListByGroupSlug(params.slug, { status: "active" });

  function toggle(expenseId: string, checked: boolean) {
    props.setSelectedExpenseIds((previous) =>
      (() => {
        switch (checked) {
          case true:
            return [...previous, expenseId];
          case false:
            return previous.filter((id) => id !== expenseId);
        }
      })()
    );
  }

  function selectAll() {
    props.setSelectedExpenseIds(() => expenses.data.map((e) => e.id));
  }

  return (
    <Dialog open={route.view() === "open"} onOpenChange={route.sync}>
      <DialogContent className="py-4 px-6 sm:max-w-2xl min-h-[30rem] h-[75vh] flex flex-col">
        <DialogHeader className="py-2 gap-1.5 flex-none">
          <DialogTitle className="uppercase">Settle Expenses</DialogTitle>
          <DialogDescription className="lowercase">
            review and select expenses to settle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          <div className="bg-secondary p-4 rounded-lg space-y-2 mb-6">
            <h4 className="font-medium text-sm uppercase">
              How Settlement Works
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-1">
                review all active expenses below
              </li>
              <li className="flex items-center gap-1">
                deselect any expenses you want to exclude
              </li>
              <li className="flex items-center gap-1">
                we'll calculate who owes what based on selected expenses
              </li>
              <li className="flex items-center gap-1">
                you'll see payment suggestions to minimize transactions
              </li>
            </ul>
          </div>

          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between flex-none h-7">
              <h4 className="font-medium text-sm uppercase">
                Active Expenses ({expenses.data.length})
              </h4>
              <Button
                variant="outline"
                className="py-1"
                size="xs"
                disabled={
                  props.selectedExpenseIds.length === expenses.data.length
                }
                onClick={selectAll}
              >
                Select All
              </Button>
            </div>

            {expenses.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active expenses to settle.
              </p>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {expenses.data.map((expense) => {
                  const isSelected = props.selectedExpenseIds.includes(
                    expense.id
                  );
                  const payer = expense.participants.find(
                    (p) => p.role === "payer"
                  );

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center space-x-3 px-3 py-2 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => toggle(expense.id, !isSelected)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          toggle(expense.id, checked === true)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium lowercase truncate">
                            {expense.description}
                          </p>
                          <p className="text-sm">
                            ${expense.amount.toString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          paid by {payer?.member?.nickname ?? "unknown"} on{" "}
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="[&>*]:w-full py-3 flex gap-2 flex-none">
          <Button
            size="xs"
            className="w-full"
            variant="outline"
            onClick={() => {
              props.previous();
            }}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className="w-full"
            variant="default"
            onClick={() => {
              if (expenses.data.length === 0) {
                route.close();
                return;
              }
              props.next();
            }}
            disabled={props.selectedExpenseIds.length === 0}
          >
            {props.selectedExpenseIds.length === 0
              ? "No Expenses"
              : "Review Settlement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
