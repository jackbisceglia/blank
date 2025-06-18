import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { withToast } from "@/lib/toast";
import {
  useExpenseListByGroupSlug,
  useBulkSettleExpenses,
} from "@/pages/_protected/@data/expenses";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useParams } from "@tanstack/react-router";
import { PropsWithChildren, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SearchRouteStep2 } from ".";

type Step2Props = PropsWithChildren<{
  setSelectedExpenseIds: (ids: string[]) => void;
  selectedExpenseIds: string[];
  previous: () => void;
  next: () => void;
}>;

export function Step2(props: Step2Props) {
  const { slug } = useParams({ strict: false });
  const route = SearchRouteStep2.useSearchRoute();

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

  if (settlements.length === 0) return null;

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
            onClick={() => props.previous()}
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
