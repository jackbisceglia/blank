import { PropsWithChildren, useEffect, useState } from "react";
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
import { useAppForm } from "@/components/form";
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
import { String, Number, pipe, Schema as S, Match } from "effect";
import { fraction } from "@/lib/monetary/fractions";
import { Button } from "@/components/ui/button";
import { underline_defaults } from "@/components/ui/utils";
import { sharedSheetLabelClassNames } from "@/components/form/shared";
import { FieldsErrors, local } from "@/components/form/errors";
import { formatUSDFormField } from "@/lib/monetary/currency";
import { positions } from "@/components/form/fields";

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
                        fraction()
                          .from(...p.split)
                          .apply(opts.expense.amount),
                      )}
                      <span className="text-blank-theme ml-auto font-bold">
                        [
                        {Math.round(
                          fraction()
                            .from(...p.split)
                            .percent(),
                        ).toString()}
                        %]
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
  view: SplitView,
) {
  type Encoded = ReturnType<typeof createSchema>["Encoded"];

  const initial: Encoded = {
    description: active.description,
    amount: pipe(active.amount, (amount) => amount.toFixed(2)),
    date: timestampToDate(active.date),
    paidBy: getPayerFromParticipants(active.participants)?.userId ?? "",
    splits: active.participants.map((p) => ({
      memberUserId: p.userId,
      amount: pipe(
        fraction()
          .from(...p.split)
          .apply(active.amount),
        (amount) => amount.toFixed(2),
      ),
      memberName: p.member?.nickname ?? "anon",
    })),
  };

  const createSchema = (total: number) => {
    const assertSumsToTotal = (items: number[]) =>
      Number.sumAll(items) === total;

    const participants = active.participants.map((p) => p.userId);

    const FormNumber = S.transform(S.String, S.Number, {
      decode: (s) => (s.trim() === "" ? 0 : parseFloat(s.trim())),
      encode: (n) => (n === 0 ? "" : n.toFixed(2)),
    });

    const SplitsSchema = S.Array(
      S.Struct({
        memberUserId: S.UUID,
        amount: FormNumber.pipe(
          S.positive(local.annotate("Must contribute > 0%")),
          S.lessThan(total, local.annotate("Can't contribute > 100%")),
        ),
        memberName: S.Union(S.String, S.Literal("anon")),
      }),
    ).pipe(
      S.filter((splits) => assertSumsToTotal(splits.map((s) => s.amount)), {
        message: () =>
          Match.value(view).pipe(
            Match.when("percent", () => "Splits must sum to 100%"),
            Match.when("amount", () => `Splits must sum to $${total}`),
            Match.orElseAbsurd,
          ),
      }),
    );

    const Schema = S.Struct({
      description: S.String,
      date: S.DateFromSelf,
      amount: FormNumber.pipe(
        S.int(local.annotate("Amount must be a whole number")),
        S.positive(local.annotate("Item must cost at least $0.01")),
        S.lessThan(100_000, local.annotate("Item must not exceed $100,000")),
      ),
      paidBy: S.Literal(...participants).pipe(
        S.annotations(local.annotate("Paid By must be a valid member")),
      ),
      splits: SplitsSchema,
    });

    return Schema;
  };

  const api = useAppForm({
    defaultValues: initial,
    validators: {
      onChange: (ctx) => {
        const total = parseFloat(ctx.value.amount);

        return createSchema(total)
          .pipe(S.standardSchemaV1)
          .pipe(ctx.formApi.parseValuesWithSchema);
      },
      onSubmit: (ctx) => {
        return ctx.formApi.state.isPristine
          ? "Fields must be updated"
          : undefined;
      },
    },
    onSubmit: async (fields) => {
      const total = parseFloat(fields.value.amount);

      const parse = createSchema(total).pipe(S.decodeSync);

      const value = parse(fields.value);

      function makeExpense() {
        return {
          description: value.description,
          amount: value.amount,
          date: value.date.getTime(),
        };
      }

      function makeParticipants() {
        function entry(userId: string, role: Participant["role"]) {
          return { userId, role };
        }

        const payerId = getPayerFromParticipants(active.participants)?.userId;

        if (payerId === value.paidBy) return undefined;

        const entries = [];

        entries.push(entry(value.paidBy, "payer"));

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

  useEffect(() => {
    api.validate("change");
  }, [view]);

  return { api, createSchema };
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
  const mode = useSplitView("amount");

  const payer = getPayerFromParticipants(active.participants);

  const mutators = useMutators();
  const form = useForm(active, mutators.expense.update, route.close, mode.view);
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

  const formatCurrencyOnBlur = (value: string) =>
    formatUSDFormField(value.length ? value : "0.00");

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
                  listeners={{
                    onBlur: (opts) =>
                      opts.fieldApi.setValue(formatCurrencyOnBlur),
                  }}
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
                      onClick={mode.toggle}
                      type="button"
                      variant="link"
                      className={cn(
                        sharedSheetLabelClassNames,
                        "font-normal px-2",
                        mode.view === tab && "text-white font-medium",
                        mode.view === tab && underline_defaults,
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
                    const total = pipe(
                      "amount" as const,
                      opts.fieldApi.form.getFieldValue,
                      parseFloat,
                    );

                    const FormSchema = form.createSchema(total);

                    return FormSchema.fields.splits
                      .pipe(S.asSchema)
                      .pipe(
                        S.filter((splits) =>
                          splits.some((s) => s.memberUserId === paidBy),
                        ),
                      )
                      .annotations({
                        message: () =>
                          '"Paid By" member must be included in splits',
                      })
                      .pipe(S.standardSchemaV1)
                      .pipe(opts.fieldApi.parseValueWithSchema);
                  },
                }}
                children={(field) => (
                  <>
                    {field.state.value.map((value, index) => (
                      <form.api.AppField
                        key={value.memberUserId}
                        listeners={{
                          onBlur: (opts) =>
                            opts.fieldApi.setValue(formatCurrencyOnBlur),
                        }}
                        name={`splits[${index}].amount`}
                        children={(element) => (
                          <form.api.Subscribe selector={(s) => s.values.amount}>
                            {(subscription) => (
                              <div className="space-y-2">
                                <element.SheetSplitField
                                  errorPosition={positions.inline()}
                                  inputProps={{
                                    disabled: active.status === "settled",
                                  }}
                                  label={value.memberName}
                                  view={mode.view}
                                  total={parseFloat(subscription)}
                                />
                              </div>
                            )}
                          </form.api.Subscribe>
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
                <form.api.SubmitButton
                  className="col-start-1 col-end-3"
                  dirty={{ disableForAria: true }}
                >
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
