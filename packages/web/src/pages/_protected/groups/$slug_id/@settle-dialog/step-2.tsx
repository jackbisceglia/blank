import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { withToast } from "@/lib/toast";
import {
  useExpenseListByGroupId,
  useBulkSettleExpenses,
} from "@/pages/_protected/@data/expenses";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PropsWithChildren } from "react";
import { SearchRouteStep2 } from ".";
import { ExpenseWithParticipants, Route } from "../page";
import { calculateSettlements, createBalanceMap } from "@/lib/balances";
import { useGroupById } from "@/pages/_protected/@data/groups";
import { CollapsibleNotification } from "@/components/collapsible-notification";
import { DialogButton } from "@/components/dialog-button";

function SettlementRequiredAlert() {
  return (
    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg space-y-2 mt-auto">
      <h4 className="font-medium text-sm text-destructive uppercase">
        Important: Manual Settlement Required
      </h4>
      <ul className="text-sm text-secondary-foreground space-y-1">
        <li>copy down the payment amounts above</li>
        <li>complete these transactions manually</li>
        <li>only confirm settlement after all payments are made</li>
      </ul>
    </div>
  );
}

type SettlementEntryProps = PropsWithChildren<{ amount: number }>;

function SettlementEntry(props: SettlementEntryProps) {
  return (
    <li className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium lowercase">{props.children}</p>
        <p className="text-xs text-muted-foreground">payment required</p>
      </div>
      <p className="text-sm font-medium">${props.amount.toFixed(2)}</p>
    </li>
  );
}

function useQueries(id: string) {
  const group = useGroupById(id);
  const expenses = useExpenseListByGroupId(id, { status: "active" });

  return { group, expenses };
}

type Step2Props = PropsWithChildren<{
  setSelectedExpenseIds: (ids: string[]) => void;
  selectedExpenseIds: string[];
  previous: () => void;
  next: () => void;
}>;

export function Step2(props: Step2Props) {
  const params = Route.useParams()["slug_id"];
  const route = SearchRouteStep2.useSearchRoute();

  const queries = useQueries(params.id);
  const bulkSettleMutation = useBulkSettleExpenses();

  // leaving these separate to potentially handle cases differently in the future
  if (queries.expenses.status === "loading") return null;
  if (queries.group.status === "loading") return null;
  if (queries.group.status === "not-found") return null;
  if (!queries.group.data?.members) return null;

  const { expenses, group } = queries;

  const selectedExpenses = expenses.data.filter((e) =>
    props.selectedExpenseIds.includes(e.id),
  );

  const balances = createBalanceMap(
    selectedExpenses as ExpenseWithParticipants[],
  );

  const settlements = calculateSettlements(group.data.members, balances);

  const handleSettlement = () => {
    void withToast({
      promise: () =>
        bulkSettleMutation({
          groupId: group.data.id,
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

  if (route.view() === "open" && settlements.length === 0) {
    throw new Error(
      "Active expense mismatch, no settlements to be made. Please fix the expenses missing a debtor.",
    );
  }

  return (
    <Dialog open={route.view() === "open"} onOpenChange={route.sync}>
      <DialogContent className="py-4 px-6 sm:max-w-2xl min-h-[30rem] h-[75vh] flex flex-col gap-2">
        <DialogHeader className="py-2 gap-1.5">
          <DialogTitle className="uppercase">Settlement Summary</DialogTitle>
          <DialogDescription className="lowercase">
            review payments and confirm settlement
          </DialogDescription>
        </DialogHeader>

        <CollapsibleNotification
          defaultExpanded
          title="Settlement Overview"
          content={(() => {
            const count = props.selectedExpenseIds.length;
            const unit = count === 1 ? "expense" : "expenses";
            const total = selectedExpenses.reduce((ct, e) => ct + e.amount, 0);

            return `Settling ${count.toString()} expense ${unit} totaling $${total.toFixed(2)}`;
          })()}
        />

        <div className="space-y-3 flex-1 flex flex-col min-h-0 pt-4">
          <div className="flex items-center justify-between flex-none h-7">
            <h4 className="font-medium text-sm uppercase">Required Payments</h4>
          </div>
          <ul className="space-y-2 flex-1 overflow-y-auto min-h-0 p-0.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
            {settlements.map((payment, index) => (
              <SettlementEntry key={index} amount={payment.amount}>
                {payment.fromName} pays {payment.toName}
              </SettlementEntry>
            ))}
          </ul>
          <SettlementRequiredAlert />
        </div>

        <DialogFooter className="py-3 flex gap-2">
          <DialogButton variant="outline" onClick={() => props.previous()}>
            Go Back
          </DialogButton>
          <DialogButton variant="default" onClick={() => handleSettlement()}>
            Confirm Settlement
          </DialogButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
