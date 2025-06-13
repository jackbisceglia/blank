import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createStackableSearchRoute } from "@/lib/search-route";
import { PropsWithChildren, useState, useMemo } from "react";
import * as v from "valibot";
import { Route } from "./page";
import {
  useExpenseListByGroupSlug,
  useBulkSettleExpenses,
} from "@/pages/_protected/@data/expenses";
import { useParams } from "@tanstack/react-router";
import { withToast } from "@/lib/toast";

const prefix = "step" as const;
const step = (num: number) => `${prefix}-${num.toString()}` as const;

export const KEY = "settle" as const;
const ENTRY1 = step(1);
const ENTRY2 = step(2);

export const SearchRoute1 = createStackableSearchRoute(KEY, ENTRY1);
export const SearchRoute2 = createStackableSearchRoute(KEY, ENTRY2);

export const SearchRouteSchema = v.object({
  [KEY]: v.optional(v.array(v.union([v.literal(ENTRY1), v.literal(ENTRY2)]))),
});

function useValidateDialogProgression() {
  const routes = [SearchRoute1.useSearchRoute(), SearchRoute2.useSearchRoute()];
  const navigate = Route.useNavigate();
  const search = Route.useSearch({
    select(state) {
      return state[KEY];
    },
  });

  function validate() {
    if ((search?.length ?? 0) === 0) return; // nothing to validate

    const current = v.safeParse(
      // parses the progression of steps, validates they're correctly in order, returns the current step
      v.pipe(
        v.array(v.string()),
        v.everyItem((s) => s.startsWith(prefix)),
        v.transform((value) => value.map((s) => s.split("-").at(1))),
        v.nonNullable(v.array(v.string())),
        v.transform((value) => value.map((s) => parseInt(s))),
        v.checkItems((item, index, array) => {
          if (item !== index + 1) return false;

          if (index === array.length - 1) return true;

          return item === array[index + 1] - 1;
        }),
        v.transform((value) => value.at(-1)),
        v.nonNullable(v.number()),
        v.integer()
      ),
      search
    );

    if (!current.success) {
      throw new Error(
        "Invalid Dialog Progression. Please start over and try again."
      );
    }
  }

  const reset = () => {
    void navigate({
      to: ".",
      search: (previous) => ({
        ...previous,
        [KEY]: undefined,
      }),
    });
  };

  function getNextStep(step: number) {
    if (step === routes.length) {
      return reset;
    }

    const next = routes.at(step)?.open;

    if (!next) {
      throw new Error(
        `Step ${(step + 1).toString()} is not a valid step. Please close the dialog and try again.`
      );
    }

    return next;
  }

  function getPreviousStep(step: number) {
    if (step === 0) {
      return reset;
    }

    const previous = routes.at(step - 1)?.close;

    if (!previous) {
      throw new Error(
        `Step ${(step - 1).toString()} is not a valid step. Please close the dialog and try again.`
      );
    }

    return previous;
  }

  return {
    validate,
    getNextStep,
    getPreviousStep,
  };
}

export function SettleExpensesDialog(_props: PropsWithChildren) {
  const progression = useValidateDialogProgression();
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  progression.validate();

  return (
    <>
      <Step1
        previous={progression.getPreviousStep(1)}
        next={progression.getNextStep(1)}
        selectedExpenseIds={selectedExpenseIds}
        setSelectedExpenseIds={setSelectedExpenseIds}
      />
      <Step2
        previous={progression.getPreviousStep(2)}
        next={progression.getNextStep(2)}
        selectedExpenseIds={selectedExpenseIds}
        setSelectedExpenseIds={setSelectedExpenseIds}
      />
    </>
  );
}

function Step1(
  props: PropsWithChildren<{
    previous: () => void;
    next: () => void;
    selectedExpenseIds: string[];
    setSelectedExpenseIds: (ids: string[]) => void;
  }>
) {
  const { slug } = useParams({ strict: false });
  const expenses = useExpenseListByGroupSlug(slug ?? "", { status: "active" });
  const route = SearchRoute1.useSearchRoute({
    hooks: {
      onOpen: () => props.setSelectedExpenseIds(expenses.data.map((e) => e.id)),
    },
  });

  const handleExpenseToggle = (expenseId: string, checked: boolean) => {
    if (checked) {
      props.setSelectedExpenseIds([...props.selectedExpenseIds, expenseId]);
    } else {
      props.setSelectedExpenseIds(
        props.selectedExpenseIds.filter((id) => id !== expenseId)
      );
    }
  };

  const selectAll = () =>
    props.setSelectedExpenseIds(expenses.data.map((e) => e.id));

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
                      onClick={() =>
                        handleExpenseToggle(expense.id, !isSelected)
                      }
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleExpenseToggle(expense.id, checked === true)
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

type Step2Props = PropsWithChildren<{
  setSelectedExpenseIds: (ids: string[]) => void;
  selectedExpenseIds: string[];
  previous: () => void;
  next: () => void;
}>;

function Step2(props: Step2Props) {
  const { slug } = useParams({ strict: false });
  const route = SearchRoute2.useSearchRoute();

  const expenses = useExpenseListByGroupSlug(slug ?? "", { status: "active" });
  const bulkSettleMutation = useBulkSettleExpenses();

  const selectedExpenses = useMemo(() => {
    const allExpenses = expenses.data;
    return allExpenses.filter((expense) =>
      props.selectedExpenseIds.includes(expense.id)
    );
  }, [expenses.data, props.selectedExpenseIds]);

  const balances = useMemo(() => {
    function createBalanceMap(expenses: typeof selectedExpenses) {
      const map = new Map<string, number>();

      expenses.forEach((expense) => {
        expense.participants.forEach((p) => {
          const balance = map.get(p.userId) ?? 0;
          const [split, delta] =
            p.role === "payer" ? [1 - p.split, 1] : [p.split, -1];
          map.set(p.userId, balance + delta * split * expense.amount);
        });
      });

      return map;
    }

    const balanceMap = createBalanceMap(selectedExpenses);
    return Array.from(balanceMap.entries())
      .map(([userId, balance]) => {
        const user = selectedExpenses
          .flatMap((e) => e.participants)
          .find((p) => p.userId === userId)?.member?.nickname;
        return {
          userId,
          balance: Math.round(balance * 100) / 100,
          displayName: user ?? "Unknown User",
        };
      })
      .filter((item) => Math.abs(item.balance) > 0.01)
      .sort((a, b) => {
        if (a.balance > 0 && b.balance <= 0) return -1;
        if (a.balance <= 0 && b.balance > 0) return 1;
        if (a.balance > 0 && b.balance > 0) return b.balance - a.balance;
        return Math.abs(a.balance) - Math.abs(b.balance);
      });
  }, [selectedExpenses]);

  const settlements = useMemo(() => {
    const creditors = balances.filter((b) => b.balance > 0);
    const debtors = balances.filter((b) => b.balance < 0);
    const payments: Array<{
      from: string;
      to: string;
      amount: number;
      fromName: string;
      toName: string;
    }> = [];

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        payments.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(amount * 100) / 100,
          fromName: debtor.displayName,
          toName: creditor.displayName,
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) creditorIndex++;
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
    }

    return payments;
  }, [balances]);

  const handleSettlement = async () => {
    await withToast({
      promise: () =>
        bulkSettleMutation({
          groupId: expenses.data[0]?.groupId,
          expenseIds: props.selectedExpenseIds,
        }),
      notify: {
        loading: "settling expenses...",
        success: "Expenses settled successfully",
        error: "Unable to settle expenses",
      },
    }).then(() => {
      props.setSelectedExpenseIds([]);
      props.next();
    });
  };

  return (
    <Dialog open={route.view() === "open"} onOpenChange={route.sync}>
      <DialogContent className="py-4 px-6 sm:max-w-2xl min-h-[30rem] h-[75vh] flex flex-col">
        <DialogHeader className="py-2 gap-1.5">
          <DialogTitle className="uppercase">Settlement Summary</DialogTitle>
          <DialogDescription className="lowercase">
            review payments and confirm settlement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          <div className="bg-secondary p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm uppercase">
              Settlement Overview
            </h4>
            <p className="text-sm text-muted-foreground lowercase">
              Settling {props.selectedExpenseIds.length} expense
              {props.selectedExpenseIds.length !== 1 ? "s" : ""} totaling $
              {selectedExpenses
                .reduce((sum, e) => sum + e.amount, 0)
                .toFixed(2)}
            </p>
          </div>

          {settlements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                All balances are settled! No payments needed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-sm uppercase">
                Required Payments
              </h4>
              <div className="space-y-2">
                {settlements.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium lowercase">
                        {payment.fromName} → {payment.toName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        payment required
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      ${payment.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg space-y-2 mt-auto">
            <h4 className="font-medium text-sm text-destructive uppercase">
              Important: Manual Settlement Required
            </h4>
            <ul className="text-sm text-foreground space-y-1">
              <li>• copy down the payment amounts above</li>
              <li>
                • complete these transactions manually (venmo, cash, etc.)
              </li>
              <li>• only confirm settlement after all payments are made</li>
              <li>• this will mark all selected expenses as settled</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="[&>*]:w-full py-3 flex gap-2">
          <Button
            size="xs"
            className="w-full"
            variant="outline"
            onClick={props.previous}
          >
            Go Back
          </Button>
          <Button
            size="xs"
            className="w-full"
            variant="default"
            onClick={() => void handleSettlement()}
          >
            Confirm Settlement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
