import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import * as v from "valibot";
import { ExpenseWithParticipants } from "./page";
import { createSearchRoute } from "@/lib/search-route";
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import { FieldsErrors, useAppForm } from "@/components/form";
import { fraction, prevented, timestampToDate } from "@/lib/utils";
import {
  DeleteOptions as DeleteExpenseOptions,
  UpdateOptions as UpdateExpenseOptions,
} from "@/lib/client-mutators/expense-mutators";
import { PropsWithChildren } from "react";
import { Separator } from "@/components/ui/separator";
import {
  getPayerFromParticipants,
  ParticipantWithMember,
} from "@/lib/participants";
import { withToast } from "@/lib/toast";
import { Participant } from "@blank/zero";
import { useDeleteOneExpense, useUpdateExpense } from "../../@data/expenses";
import { optional } from "@blank/core/lib/utils/index";
import { ChevronRight } from "lucide-react";
import { useAuthentication } from "@/lib/authentication";
import { DialogDescription } from "@/components/ui/dialog";

export const KEY = "expense" as const;
export const SearchRouteSchema = v.object({
  [KEY]: v.optional(v.string()),
});
export const SearchRoute = createSearchRoute(KEY);

function useConfirmDeleteExpense(
  expenseId: string,
  deleteMutation: (opts: DeleteExpenseOptions) => Promise<void>,
  leave: () => void,
) {
  return useWithConfirmation({
    title: "Delete expense?",
    description: { type: "default", entity: "expense" },
    onConfirm: async () => {
      return withToast({
        promise: () => {
          return deleteMutation({ expenseId });
        },
        notify: {
          loading: "deleting expense...",
          success: "Expense deleted successfully",
          error: "Unable to delete expense",
        },
        classNames: {
          success: "!bg-secondary !border-border",
        },
      }).then(() => leave());
    },
  });
}

function useConfirmSettleExpense(
  expense: ExpenseWithParticipants,
  userId: string,
  settleMutation: (opts: UpdateExpenseOptions) => Promise<void>,
  leave: () => void,
) {
  const payer = getPayerFromParticipants(expense.participants);
  if (!payer) {
    throw new Error("Payer not found");
  }

  const getSettleUpSentence = (
    p1: ParticipantWithMember,
    p2: ParticipantWithMember,
    amount: number,
  ) => {
    const payerIsCurrentUser = p1.userId === userId;
    const payeeIsCurrentUser = p2.userId === userId;

    return [
      payerIsCurrentUser ? "You" : p1.member?.nickname,
      payerIsCurrentUser ? "owe" : "owes",
      payeeIsCurrentUser ? "You" : p2.member?.nickname,
      `$${amount.toFixed(2)}`,
    ].join(" ");
  };

  return useWithConfirmation({
    title: "Settle expense?",
    subtitle: false,
    description: {
      type: "jsx",
      value: () => (
        <div className="space-y-4">
          <DialogDescription>
            This will settle and archive the expense. Be sure to settle up with
            all participants. The following transaction must be made:
          </DialogDescription>
          <ul className="list-inside text-sm text-foreground space-y-1.5 mb-4">
            {expense.participants
              .filter((p) => p.role === "participant")
              .map((p) => (
                <li
                  key={p.userId}
                  className="flex items-center justify-between gap-2 mx-2 text-foreground lowercase"
                >
                  <ChevronRight className="size-3.5" />
                  {getSettleUpSentence(
                    p,
                    payer,
                    fraction(p.split).apply(expense.amount),
                  )}
                  <span className="text-blank-theme ml-auto font-bold">
                    [{Math.round(fraction(p.split).percent()).toString()}%]
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ),
    },
    confirm: "Settle",
    confirmVariant: "theme",
    onConfirm: async () => {
      return withToast({
        promise: () => {
          return settleMutation({
            expenseId: expense.id,
            updates: { expense: { status: "settled" } },
          });
        },
        notify: {
          loading: "settling expense...",
          success: "Expense settled successfully",
          error: "Unable to settle expense",
        },
        classNames: {
          success: "!bg-secondary !border-border",
        },
      }).then(() => {
        leave();
      });
    },
  });
}

function useMutators() {
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteOneExpense();

  return {
    expense: {
      update: updateExpense,
      delete: deleteExpense,
    },
  };
}

function useForm(
  active: ExpenseWithParticipants,
  updateMutation: (opts: UpdateExpenseOptions) => Promise<void>,
  leave: () => void,
) {
  const schema = v.pipe(
    v.object({
      description: v.string(),
      amount: v.pipe(
        v.number(),
        v.minValue(0.01, "Item must cost at least $0.01"),
        v.maxValue(100_000, "Item must not exceed $100,000"),
      ),
      date: v.date(),
      paidBy: v.picklist(
        active.participants.map((p) => p.userId),
        "paidBy must be a valid member",
      ),
    }),
    v.check((schema) => {
      return (
        schema.amount !== active.amount ||
        schema.description !== active.description ||
        schema.date.getTime() !== active.date ||
        schema.paidBy !== getPayerFromParticipants(active.participants)?.userId
      );
    }),
  );

  const api = useAppForm({
    defaultValues: {
      description: active.description,
      amount: active.amount,
      date: timestampToDate(active.date),
      paidBy: getPayerFromParticipants(active.participants)?.userId ?? "",
    },
    validators: {
      onChange: schema,
      onSubmit: (ctx) => {
        return ctx.formApi.state.isPristine
          ? "Fields must be updated"
          : undefined;
      },
    },
    onSubmit: async (fields) => {
      function makeExpense() {
        return {
          description: fields.value.description,
          amount: fields.value.amount,
          date: fields.value.date.getTime(),
        };
      }

      function makeParticipants() {
        function entry(userId: string, role: Participant["role"]) {
          return { userId, role };
        }

        const payerId = getPayerFromParticipants(active.participants)?.userId;

        if (payerId === fields.value.paidBy) return undefined;

        const entries = [];

        entries.push(entry(fields.value.paidBy, "payer"));

        if (payerId) {
          entries.push(entry(payerId, "participant"));
        }

        return entries;
      }

      leave();

      const result = await withToast({
        promise: () => {
          return updateMutation({
            expenseId: active.id,
            updates: {
              expense: makeExpense(),
              ...optional({ participants: makeParticipants() }),
            },
          });
        },
        notify: {
          loading: "updating expense...",
          success: "Expense updated successfully",
          error: "Unable to update expense",
        },
      });

      fields.formApi.reset();

      return result;
    },
  });

  return { api };
}

type ExpenseSheetProps = PropsWithChildren<{
  expense: ExpenseWithParticipants;
}>;

export function ExpenseSheet(props: ExpenseSheetProps) {
  const auth = useAuthentication();
  const route = SearchRoute.useSearchRoute();
  const active = props.expense;

  const mutators = useMutators();
  const form = useForm(active, mutators.expense.update, route.close);
  const deleteExpense = useConfirmDeleteExpense(
    active.id,
    mutators.expense.delete,
    route.close,
  );
  const settleExpense = useConfirmSettleExpense(
    active,
    auth.user.id,
    mutators.expense.update,
    route.close,
  );
  const unsettleExpense = () => {
    route.close();
    void withToast({
      promise: async () => {
        await mutators.expense.update({
          expenseId: active.id,
          updates: { expense: { status: "active" } },
        });
      },
      notify: {
        loading: "updating expense...",
        success: "Expense marked as active",
        error: "Unable to mark expense as active",
      },
    });
  };

  return (
    <>
      <deleteExpense.dialog />
      <settleExpense.dialog />
      <Sheet route={route} onOpenChange={route.sync}>
        <SheetContent
          className="outline-none bg-background border-sidebar-border/50"
          aria-describedby={undefined}
        >
          <form
            className="h-full flex flex-col gap-2"
            onSubmit={prevented(() => void form.api.handleSubmit())}
          >
            <SheetHeader className="gap-1 pb-4">
              <SheetTitle className="text-lg font-semibold text-foreground uppercase">
                {active.description}
              </SheetTitle>
              <div className="text-sm text-muted-foreground lowercase">
                {active.createdAt
                  ? new Date(active.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </div>
            </SheetHeader>
            <SheetBody className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="col-span-2">
                <form.api.AppField
                  name="description"
                  children={(field) => (
                    <field.SheetTextField
                      inputProps={{
                        disabled: active.status === "settled",
                      }}
                      label="description"
                    />
                  )}
                />
              </div>
              <div className="col-span-1">
                <form.api.AppField
                  name="amount"
                  children={(field) => (
                    <field.SheetCostField
                      inputProps={{
                        disabled: active.status === "settled",
                      }}
                      label="Cost (USD)"
                    />
                  )}
                />
              </div>
              <div className="col-span-1">
                <form.api.AppField
                  name="date"
                  children={(field) => (
                    <field.SheetDateField
                      inputProps={{
                        disabled: active.status === "settled",
                      }}
                      label="Date"
                    />
                  )}
                />
              </div>

              <div className="col-span-2">
                <form.api.AppField
                  name="paidBy"
                  children={(field) => (
                    <field.SheetPaidByField
                      inputProps={{
                        disabled: active.status === "settled",
                      }}
                      participants={active.participants}
                      label="Paid by"
                    />
                  )}
                />
              </div>
              <Separator className="col-span-full my-4" />
              <ul className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  just for debugging for now
                </p>
                {active.participants
                  .map(
                    (p) =>
                      [
                        p.member?.nickname,
                        fraction(p.split).percent(),
                      ] as const,
                  )
                  .filter((tuple): tuple is [string, number] => !!tuple[0])
                  .map(([name, split]) => (
                    <li key={name}>
                      {name}: {split.toString()}%
                    </li>
                  ))}
              </ul>
            </SheetBody>
            <SheetFooter className="flex-col gap-2 mt-auto grid grid-cols-2">
              <form.api.Subscribe
                selector={(state) => state.fieldMeta}
                children={(fieldMeta) => (
                  <FieldsErrors
                    className="col-span-full"
                    metas={Object.values(fieldMeta)}
                  />
                )}
              ></form.api.Subscribe>
              <form.api.AppForm>
                <form.api.SubmitButton className="col-start-1 col-end-3">
                  Save
                </form.api.SubmitButton>
                {active.status === "active" ? (
                  <form.api.SettleButton
                    className="col-span-1"
                    onClick={settleExpense.confirm}
                  >
                    Settle
                  </form.api.SettleButton>
                ) : (
                  <form.api.SettleButton
                    className="col-span-1"
                    onClick={() => unsettleExpense()}
                  >
                    Unsettle
                  </form.api.SettleButton>
                )}
                <form.api.CancelButton
                  className="col-span-1"
                  onClick={deleteExpense.confirm}
                >
                  Delete
                </form.api.CancelButton>
              </form.api.AppForm>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
