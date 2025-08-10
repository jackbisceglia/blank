import { PropsWithChildren, useState } from "react";
import { ExpenseWithParticipants } from "../page";
import { useAuthentication } from "@/lib/authentication";
import {
  getPayerFromParticipants,
  ParticipantWithMember,
} from "@/lib/participants";
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import { withToast } from "@/lib/toast";
import {
  DeleteOptions as DeleteExpenseOptions,
  UpdateOptions as UpdateExpenseOptions,
} from "@/lib/client-mutators/expense-mutators";
import { DialogDescription } from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import { cn, prevented, timestampToDate } from "@/lib/utils";
import {
  useDeleteOneExpense,
  useUpdateExpense,
} from "@/pages/_protected/@data/expenses";
import * as v from "valibot";
import { FieldsErrors, useAppForm } from "@/components/form";
import { Participant } from "@blank/zero";
import { optional } from "@blank/core/lib/utils/index";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import ExpenseSheetSearchRoute from "./route";
import { Number, String } from "effect";
import { fraction } from "@/lib/fractions";
import { Button } from "@/components/ui/button";
import { underline_defaults } from "@/components/ui/utils";
import { sharedSheetLabelClassNames } from "@/components/form/shared";

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

type UseConfirmSettleExpense = {
  expense: ExpenseWithParticipants;
  payer: ParticipantWithMember | undefined;
  userId: string;
  settleMutation: (opts: UpdateExpenseOptions) => Promise<void>;
  leave: () => void;
};

function useConfirmSettleExpense(opts: UseConfirmSettleExpense) {
  const getSettleUpSentence = (
    p1: ParticipantWithMember,
    p2: ParticipantWithMember,
    amount: number,
  ) => {
    const payerIsCurrentUser = p1.userId === opts.userId;
    const payeeIsCurrentUser = p2.userId === opts.userId;

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
      value: () => {
        const payer = opts.payer;

        if (!payer) {
          throw new Error("Can not settle expense without a payer");
        }

        return (
          <div className="space-y-4">
            <DialogDescription>
              This will settle and archive the expense. Be sure to settle up
              with all participants. The following transaction must be made:
            </DialogDescription>
            <ul className="list-inside text-sm text-foreground space-y-1.5 mb-4">
              {opts.expense.participants.length > 1 ? (
                opts.expense.participants
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
                        fraction(p.split).apply(opts.expense.amount),
                      )}
                      <span className="text-blank-theme ml-auto font-bold">
                        [{Math.round(fraction(p.split).percent()).toString()}%]
                      </span>
                    </li>
                  ))
              ) : (
                <div className="flex items-center gap-2 mx-2 text-foreground lowercase">
                  <ChevronRight className="size-3.5" />
                  <p>
                    {payer.member?.nickname} is the only participant, no
                    payments required
                  </p>
                </div>
              )}
            </ul>
          </div>
        );
      },
    },
    confirm: "Settle",
    confirmVariant: "theme",
    onConfirm: async () => {
      return withToast({
        promise: () => {
          return opts.settleMutation({
            expenseId: opts.expense.id,
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
        opts.leave();
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
  type Initial = typeof initial;

  const initial = {
    description: active.description,
    amount: active.amount,
    date: timestampToDate(active.date),
    paidBy: getPayerFromParticipants(active.participants)?.userId ?? "",
    splits: active.participants.map((p) => ({
      split: fraction(p.split).percent(),
      memberUserId: p.userId,
      memberName: p.member?.nickname ?? "anon",
    })),
  };

  const compareSplits = (a: Initial["splits"], b: Initial["splits"]) => {
    const aIsSubsetOfB = a.reduce((acc, entry) => {
      const match =
        entry.split ===
        b.find((s) => s.memberUserId === entry.memberUserId)?.split;

      return acc && match;
    }, true);

    return a.length === b.length && aIsSubsetOfB;
  };

  const Schema = v.pipe(
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
      splits: v.array(
        v.object({
          split: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
          memberUserId: v.union([
            v.pipe(v.string(), v.uuid()),
            v.literal("anon"),
          ]),
          memberName: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
        }),
      ),
    }),
    v.check((schema) => {
      return (
        schema.amount !== initial.amount ||
        schema.description !== initial.description ||
        schema.date.getTime() !== initial.date.getTime() ||
        schema.paidBy !== initial.paidBy ||
        !compareSplits(schema.splits, initial.splits)
      );
    }),
  );

  const api = useAppForm({
    defaultValues: initial,
    validators: {
      onChange: Schema,
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

  return { api, Schema };
}

type ExpenseSheetProps = PropsWithChildren<{
  expense: ExpenseWithParticipants;
}>;

export type SplitView = "percent" | "amount";

export function useSplitView(initial: SplitView) {
  const [view, setView] = useState<SplitView>(initial);

  const toggle = () => setView((v) => (v === "percent" ? "amount" : "percent"));

  return { view, toggle };
}

export function ExpenseSheet(props: ExpenseSheetProps) {
  const auth = useAuthentication();
  const route = ExpenseSheetSearchRoute.useSearchRoute();
  const active = props.expense;
  const splitView = useSplitView("percent");

  const payer = getPayerFromParticipants(active.participants);

  Number.parse;
  const mutators = useMutators();
  const form = useForm(active, mutators.expense.update, route.close);
  const deleteExpense = useConfirmDeleteExpense(
    active.id,
    mutators.expense.delete,
    route.close,
  );

  const settleExpense = useConfirmSettleExpense({
    expense: active,
    payer: payer,
    userId: auth.user.id,
    settleMutation: mutators.expense.update,
    leave: route.close,
  });

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

  //const amount = useStore(form.api.store, (s) => s.values.amount);

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
              <div className="col-span-2 space-y-2">
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
              <div className="col-span-1 space-y-2">
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
              <div className="col-span-1 space-y-2">
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

              <div className="col-span-2 space-y-2">
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
              <Separator className="col-span-full my-2" />
              <div className="col-span-full flex justify-between items-center">
                <p className={cn(sharedSheetLabelClassNames, "text-sm")}>
                  Splits
                </p>
                <ul className="flex">
                  {(["percent", "amount"] as const).map((tab, index, array) => (
                    <Button
                      key={tab}
                      onClick={splitView.toggle}
                      type="button"
                      variant="link"
                      className={cn(
                        sharedSheetLabelClassNames,
                        "font-normal px-2",
                        splitView.view === tab && "text-white font-medium",
                        splitView.view === tab && underline_defaults,
                        index === array.length - 1 && "pr-1",
                        index === 0 && "pl-1",
                      )}
                    >
                      {String.capitalize(tab)}
                    </Button>
                  ))}
                </ul>
              </div>
              <form.api.AppField
                name="splits"
                mode="array"
                validators={{
                  onChangeListenTo: ["paidBy"],
                  onChange: (opts) => {
                    const paidBy = opts.fieldApi.form.getFieldValue("paidBy");
                    const paidByCheck = (splits: typeof opts.value) =>
                      splits.some((split) => split.memberUserId === paidBy);

                    const SplitsLinked = v.pipe(
                      form.Schema.entries.splits,
                      v.check(
                        paidByCheck,
                        '"Paid By" member must be included in splits',
                      ),
                    );
                    return opts.fieldApi.parseValueWithSchema(SplitsLinked);
                  },
                }}
                children={(field) => (
                  <>
                    {field.state.value.map((value, index) => (
                      <form.api.AppField
                        key={value.memberUserId}
                        name={`splits[${index}].split`}
                        children={(element) => (
                          <div className="space-y-2">
                            <element.SheetSplitField
                              inputProps={{
                                disabled: active.status === "settled",
                              }}
                              label={value.memberName}
                              splitView={splitView.view}
                              total={form.api.getFieldValue("amount")}
                              totalB={form.api.getFieldValue("amount")}
                            />
                          </div>
                        )}
                      />
                    ))}
                  </>
                )}
              />
            </SheetBody>
            <SheetFooter className="flex-col gap-2 mt-auto grid grid-cols-2">
              <form.api.Subscribe
                selector={(state) => state.fieldMeta}
                children={(fieldMeta) => (
                  <FieldsErrors
                    ul={{ className: "col-span-full" }}
                    metas={fieldMeta}
                  />
                )}
              ></form.api.Subscribe>
              <form.api.AppForm>
                <form.api.SubmitButton className="col-start-1 col-end-3">
                  Save
                </form.api.SubmitButton>
                {active.status === "active" ? (
                  <form.api.SettleButton
                    className="col-span-1 h-min"
                    disabled={!payer}
                    onClick={settleExpense.confirm}
                  >
                    Settle
                  </form.api.SettleButton>
                ) : (
                  <form.api.SettleButton
                    className="col-span-1 h-auto"
                    disabled={!payer}
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
