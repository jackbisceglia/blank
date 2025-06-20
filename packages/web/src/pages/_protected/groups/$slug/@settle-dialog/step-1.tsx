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
import { Card, CardContent } from "@/components/ui/card";

import { SearchRouteStep1 } from ".";
import { Route } from "../page";
import { cn } from "@/lib/utils";
import { CollapsibleNotification } from "@/components/collapsible-notification";
import { DialogButton } from "@/components/dialog-button";

type Step1Props = PropsWithChildren<{
  previous: () => void;
  next: () => void;
  selectedExpenseIds: string[];
  setSelectedExpenseIds: (ids: (previous: string[]) => string[]) => void;
}>;

export function Step1(props: Step1Props) {
  const params = Route.useParams();
  const route = SearchRouteStep1.useSearchRoute({
    hooks: { onOpen: selectAll },
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
      })(),
    );
  }

  function selectAll() {
    props.setSelectedExpenseIds(() => expenses.data.map((e) => e.id));
  }

  if (expenses.data.length === 0) return null;

  const someSelected = props.selectedExpenseIds.length > 0;

  return (
    <Dialog open={route.view() === "open"} onOpenChange={route.sync}>
      <DialogContent className="py-4 px-6 sm:max-w-2xl min-h-[30rem] h-[75vh] flex flex-col gap-2">
        <DialogHeader className="py-2 gap-1.5 flex-none">
          <DialogTitle className="uppercase">Settle Expenses</DialogTitle>
          <DialogDescription className="lowercase">
            review and select expenses to settle
          </DialogDescription>
        </DialogHeader>

        <CollapsibleNotification
          title="How Settlement Works"
          content={[
            "you review expenses below",
            "we calculate the minimal necessary payments",
            "you confirm and manually make payments with your group",
          ]}
        />

        <div className="space-y-3 flex-1 flex flex-col min-h-0 pt-4">
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
            <p className="text-sm text-muted-foreground py-4 text-center uppercase">
              No active expenses to settle.
            </p>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0 p-0.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
              {expenses.data.map((expense) => {
                const isSelected = props.selectedExpenseIds.includes(
                  expense.id,
                );
                const payer = expense.participants.find(
                  (p) => p.role === "payer",
                );

                return (
                  <Card
                    key={expense.id}
                    className={cn(
                      "cursor-pointer hover:bg-accent/50 transition-[color,box-shadow] duration-0 not-focus-within:outline-hidden focus-visible:outline-2 focus:relative focus-visible:z-10 bg-accent/30  focus-visible:outline-primary/50",
                      !isSelected && "text-foreground/50 border-border/50",
                    )}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-labelledby={`expense-${expense.id}-label`}
                    onClick={() => toggle(expense.id, !isSelected)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggle(expense.id, !isSelected);
                      }
                    }}
                  >
                    <CardContent className="flex items-center space-x-3 p-3">
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        aria-hidden="true"
                        aria-readonly
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            id={`expense-${expense.id}-label`}
                            className="text-sm font-medium lowercase truncate"
                          >
                            {expense.description}
                          </p>
                          <p className="text-sm">
                            ${expense.amount.toString()}
                          </p>
                        </div>
                        <p className="text-xs">
                          paid by {payer?.member?.nickname ?? "unknown"} on{" "}
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="py-3 flex gap-2 flex-none">
          <DialogButton variant="outline" onClick={() => props.previous()}>
            Cancel
          </DialogButton>
          <DialogButton onClick={() => props.next()} disabled={!someSelected}>
            {someSelected ? "Review Settlement" : "None Selected"}
          </DialogButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
