import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as v from "valibot";
import { Expenses } from "./page";
import { createSearchRoute } from "@/lib/create-search-route";
import { useConfirmDialog } from "@/components/confirm-dialog";
import {
  useDeleteExpense,
  useUpdateExpense,
  useUpdateExpenseParticipants,
} from "./@data";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useZero } from "@/lib/zero.provider";

const key = "expense" as const;
export const SearchRouteSchema = v.object({
  [key]: v.optional(v.string()),
});
export const SearchRoute = createSearchRoute(key);

type ExpenseSheetProps = {
  expenses: Expenses[];
};

function SheetInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(
        "bg-accent/30 border-sidebar-border/30 text-foreground placeholder:text-muted-foreground/60 h-10 focus-visible:ring-1 focus-visible:border-sidebar-border/50",
        className
      )}
      {...props}
    />
  );
}

function SheetLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn(
        "lowercase font-medium text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function FieldGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

export function ExpenseSheet(props: ExpenseSheetProps) {
  const route = SearchRoute.useSearchRoute();
  const active = props.expenses.find((expense) => expense.id === route.state());
  const updateExpense = useUpdateExpense();
  const updateExpenseParticipants = useUpdateExpenseParticipants();
  const deleteExpense = useDeleteExpense();

  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingSplits, setEditingSplits] = useState(false);
  const [splitMode, setSplitMode] = useState<"percentage" | "value">(
    "percentage"
  );
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: "",
  });
  const [originalData, setOriginalData] = useState({
    description: "",
    amount: "",
    date: "",
  });
  const [participantSplits, setParticipantSplits] = useState<
    Record<string, number>
  >({});
  const [originalSplits, setOriginalSplits] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    if (active) {
      const date = new Date(active.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const data = {
        description: active.description,
        amount: active.amount.toString(),
        date: dateStr,
      };

      setFormData(data);
      setOriginalData(data);
      setHasChanges(false);

      // Initialize participant splits (including payer)
      const splits: Record<string, number> = {};
      active.participants.forEach((p) => {
        splits[p.userId] = p.split;
      });
      setParticipantSplits(splits);
      setOriginalSplits(splits);
    }
  }, [active]);

  const ConfirmDelete = useConfirmDialog({
    title: "Delete expense?",
    description: { type: "default", entity: "expense" },
    onConfirm: async () => {
      try {
        await deleteExpense({ expenseId: active?.id ?? "" });
        route.close();
      } catch (error) {
        console.error("DELETE_ERROR", JSON.stringify(error, null, 2));
      }
    },
  });

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const hasSplitChanges =
      JSON.stringify(participantSplits) !== JSON.stringify(originalSplits);
    setHasChanges(
      originalData.description !==
        (field === "description" ? value : formData.description) ||
        originalData.amount !==
          (field === "amount" ? value : formData.amount) ||
        originalData.date !== (field === "date" ? value : formData.date) ||
        hasSplitChanges
    );
  };

  const handleSplitChange = (userId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newValue =
      splitMode === "percentage"
        ? numValue / 100
        : numValue / parseFloat(formData.amount);

    setParticipantSplits((prev) => ({ ...prev, [userId]: newValue }));

    const newSplits = { ...participantSplits, [userId]: newValue };
    const hasSplitChanges =
      JSON.stringify(newSplits) !== JSON.stringify(originalSplits);
    setHasChanges(
      originalData.description !== formData.description ||
        originalData.amount !== formData.amount ||
        originalData.date !== formData.date ||
        hasSplitChanges
    );
  };

  const validateSplits = () => {
    const total = Object.values(participantSplits).reduce(
      (sum, split) => sum + split,
      0
    );
    return Math.abs(total - 1) < 0.0001;
  };

  const handleSave = async () => {
    if (!active || !hasChanges) return;

    // Validate splits if they were changed
    const hasSplitChanges =
      JSON.stringify(participantSplits) !== JSON.stringify(originalSplits);
    if (hasSplitChanges && !validateSplits()) {
      toast.error("Splits must add up to 100%");
      return;
    }

    setIsUpdating(true);
    try {
      const updates: any = {};

      if (formData.description !== active.description) {
        updates.description = formData.description;
      }
      if (formData.amount !== active.amount.toString()) {
        updates.amount = parseFloat(formData.amount);
      }

      const activeDate = new Date(active.date);
      const activeYear = activeDate.getFullYear();
      const activeMonth = String(activeDate.getMonth() + 1).padStart(2, "0");
      const activeDay = String(activeDate.getDate()).padStart(2, "0");
      const activeDateStr = `${activeYear}-${activeMonth}-${activeDay}`;

      if (formData.date !== activeDateStr) {
        updates.date = new Date(formData.date).getTime();
      }

      // Update expense fields if needed
      if (Object.keys(updates).length > 0) {
        await updateExpense({ expenseId: active.id, updates });
      }

      // Update participant splits if needed
      if (hasSplitChanges) {
        const participantUpdates = Object.entries(participantSplits).map(
          ([userId, split]) => ({
            userId,
            split,
          })
        );
        await updateExpenseParticipants({
          expenseId: active.id,
          participants: participantUpdates,
        });
      }

      toast.success("Expense updated");
      setOriginalData(formData);
      setOriginalSplits(participantSplits);
      setHasChanges(false);
      setEditingSplits(false);
    } catch (error) {
      toast.error("Failed to update expense");
      console.error("UPDATE_ERROR", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!active) return null;

  const participants = active.participants || [];
  const payer = participants.find((p) => p.role === "payer");
  const splitParticipants = participants.filter(
    (p) => p.role === "participant"
  );

  return (
    <>
      <ConfirmDelete.dialog />
      <Sheet
        open={route.view() === "open"}
        onOpenChange={(bool) => {
          if (!bool) return route.close();
        }}
      >
        <SheetContent className="bg-background border-sidebar-border/50">
          <SheetHeader className="space-y-1 pb-4">
            <SheetTitle className="text-lg font-semibold text-foreground">
              {active.description}
            </SheetTitle>
            <div className="text-sm text-muted-foreground">
              {active.createdAt
                ? new Date(active.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A"}
            </div>
          </SheetHeader>

          <SheetBody className="space-y-6">
            <FieldGroup>
              <SheetLabel htmlFor="description">description</SheetLabel>
              <SheetInput
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                disabled={isUpdating}
                placeholder="what was this expense for?"
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup>
                <SheetLabel htmlFor="amount">amount</SheetLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <SheetInput
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      handleFieldChange("amount", e.target.value)
                    }
                    disabled={isUpdating}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </FieldGroup>

              <FieldGroup>
                <SheetLabel htmlFor="date">date</SheetLabel>
                <SheetInput
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  disabled={isUpdating}
                />
              </FieldGroup>
            </div>

            <FieldGroup className="pt-4 border-t border-sidebar-border/30">
              <div className="flex items-center justify-between mb-2">
                <SheetLabel>participants</SheetLabel>
                {participants.length > 0 && (
                  <div className="flex items-center gap-2">
                    {editingSplits && (
                      <div className="flex items-center gap-1 bg-accent/20 rounded-xs ">
                        <Button
                          variant="ghost"
                          size="xs"
                          type="button"
                          onClick={() => setSplitMode("percentage")}
                          className={cn(
                            "text-xs rounded-xs transition-colors uppercase",
                            splitMode === "percentage"
                              ? "bg-secondary/50 text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Percent
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          type="button"
                          onClick={() => setSplitMode("value")}
                          className={cn(
                            "rounded-xs transition-colors uppercase",
                            splitMode === "value"
                              ? "bg-secondary/50 text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Total
                        </Button>
                      </div>
                    )}
                    <Button
                      variant={editingSplits ? "destructive" : "ghost"}
                      size="xs"
                      type="button"
                      onClick={() => setEditingSplits(!editingSplits)}
                      className="transition-colors"
                    >
                      {editingSplits ? "cancel" : "edit splits"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {participants.map(
                  (p) =>
                    p.member && (
                      <div
                        key={`${p.userId}-${p.expenseId}`}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-sm",
                          p.role === "payer" && "bg-accent/20"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {p.member.nickname}
                          </span>
                          {p.role === "payer" && (
                            <span className="text-xs lowercase text-foreground/70 bg-secondary/40 px-2 py-1 rounded-xs">
                              paid
                            </span>
                          )}
                        </div>
                        {editingSplits ? (
                          <div className="flex items-center gap-2">
                            <SheetInput
                              type="number"
                              value={
                                splitMode === "percentage"
                                  ? (participantSplits[p.userId] * 100).toFixed(
                                      0
                                    )
                                  : (
                                      parseFloat(formData.amount) *
                                      participantSplits[p.userId]
                                    ).toFixed(2)
                              }
                              onChange={(e) =>
                                handleSplitChange(p.userId, e.target.value)
                              }
                              className="w-20 h-8 text-right px-2"
                              placeholder="0"
                              step={splitMode === "percentage" ? "1" : "0.01"}
                            />
                            <span className="text-xs text-muted-foreground w-4">
                              {splitMode === "percentage" ? "%" : "$"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-foreground/80">
                            $
                            {(
                              parseFloat(formData.amount) *
                              participantSplits[p.userId]
                            ).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )
                )}
                {editingSplits && participants.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-sidebar-border/30">
                    <div className="flex items-center justify-between px-3 py-1">
                      <span className="text-xs text-muted-foreground">
                        total
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          validateSplits()
                            ? "text-foreground/70"
                            : "text-destructive"
                        )}
                      >
                        {(
                          Object.values(participantSplits).reduce(
                            (sum, split) => sum + split,
                            0
                          ) * 100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </FieldGroup>
          </SheetBody>

          <SheetFooter className="flex-col gap-2">
            <Button
              onClick={handleSave}
              variant="theme"
              size="sm"
              className="w-full"
              disabled={!hasChanges || isUpdating}
            >
              {isUpdating ? "saving..." : "save changes"}
            </Button>
            <Button
              onClick={() => ConfirmDelete.confirm()}
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={isUpdating}
            >
              delete expense
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
