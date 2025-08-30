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
  UpdateOptions,
} from "@/lib/client-mutators/expense-mutators";
import { DialogDescription } from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import { cn, prevented, tapPipeline, timestampToDate } from "@/lib/utils";
import {
  useDeleteOneExpense,
  useUpdateExpense,
} from "@/pages/_protected/@data/expenses";
import { useAppForm } from "@/components/form";
import { FieldsErrors, local, metasToErrors } from "@/components/form/errors";
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
import { fraction } from "@/lib/monetary/fractions";
import { pipe, Number, Schema as S, Match, String, Option } from "effect";
import { formatUSD } from "@/lib/monetary/currency";
import { sharedSheetLabelClassNames } from "@/components/form/shared";
import { SharedError } from "@/components/form/shared";
import { Button } from "@/components/ui/button";
import { underline_defaults } from "@/components/ui/utils";
import { positions } from "@/components/form/fields";

type Split = {
  memberUserId: string;
  memberName: string;
  amount: string;
  percent: string;
};

type SplitDecoded = {
  memberUserId: string;
  amount: number;
  memberName: string;
};

type UpdateSplitOptions = {
  value: string;
  total: string;
  key: SplitView;
};

const orStringifiedZeroIfEmpty = (value: string) =>
  pipe(
    Option.liftPredicate(value, (str) => !!str && str !== ""),
    Option.getOrElse(() => "0"),
  );

const orEmptyStringIfNullable = (value: string | undefined) =>
  pipe(
    Option.fromNullable(value),
    Option.getOrElse(() => ""),
  );

const toFixed2 = (num: number) => num.toFixed(2);

function updateSplit(options: UpdateSplitOptions) {
  const total = parseFloatCustom(options.total);

  // we use the current total and updated field/value to derive the alternative format's value
  // eg. when we're editing percentage, we return key/value of amount and derived amount to be set in the form
  const derived = Match.value(options.key).pipe(
    Match.when("percent", () => ({
      key: "amount",
      value: pipe(
        options.value,
        (percent) => parseFloatCustom(percent),
        Number.divide(100),
        Option.getOrThrow,
        Number.multiply(total),
        toFixed2,
      ),
    })),
    Match.when("amount", () => ({
      key: "percent",
      value: pipe(
        options.value,
        (amount) => parseFloatCustom(amount),
        Number.divide(total),
        Option.getOrThrowWith(() => "Unable to split with $0 total"),
        Number.multiply(100),
        Number.round(2),
        (amount) => amount.toString(),
      ),
    })),
    Match.orElseAbsurd,
  );

  return (split: Split) => ({
    ...split,
    [options.key]: options.value, // value being updated (amount / percent)
    [derived.key]: derived.value, // derived value (inverse of of ^)
  });
}

function checkSplitsEqual(
  a: ReadonlyArray<SplitDecoded>,
  b: ReadonlyArray<Split>,
) {
  return a.reduce((bool, split) => {
    const match = b.find((s) => s.memberUserId === split.memberUserId);

    return bool && split.amount === parseFloatCustom(match?.amount);
  }, a.length === b.length);
}

function parseFloatCustom(total: string | undefined) {
  return pipe(
    total,
    orEmptyStringIfNullable,
    String.trim,
    orStringifiedZeroIfEmpty,
    parseFloat,
  );
}

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
  const participants = active.participants.map((p) => p.userId);

  const initialSplits: ReadonlyArray<Split> = active.participants.map((p) => {
    const utils = fraction().from(...p.split);

    return {
      memberUserId: p.userId,
      memberName: p.member?.nickname ?? "anon",
      amount: utils.apply(active.amount).toFixed(2),
      percent: utils.percent().toFixed(2),
    };
  });

  const initial = {
    description: active.description,
    amount: pipe(active.amount, toFixed2),
    date: timestampToDate(active.date),
    paidBy: getPayerFromParticipants(active.participants)?.userId ?? "",
    splits: initialSplits,
  } as const;

  const createSchema = (total: number) => {
    const FormNumber = S.transform(S.String, S.Number, {
      decode: (s) => parseFloatCustom(s),
      encode: (n) => n.toFixed(2),
    });

    const SplitsSchema = S.Array(
      S.Struct({
        memberUserId: S.UUID,
        memberName: S.Union(S.String, S.Literal("anon")),
        amount: FormNumber.pipe(
          S.greaterThan(0, local.annotate("Must contribute > 0%")),
          S.lessThan(total, local.annotate("Can't contribute > 100%")),
        ),
        percent: FormNumber.pipe(
          S.greaterThan(0, local.annotate("Must contribute > 0%")),
          S.lessThan(100, local.annotate("Can't contribute > 100%")),
        ),
      }),
    ).pipe(
      S.filter((splits) => {
        const splitsSum = Number.sumAll(splits.map((s) => s.amount));
        const offset = splitsSum - total;

        const remaining = Match.value(view).pipe(
          Match.when("percent", function () {
            const asPercent = pipe(
              fraction().from(splitsSum, total).inverse().percent(),
              Math.abs,
              toFixed2,
              (percent) => `${percent}%`,
            );

            return Match.value(offset).pipe(
              Match.when(Number.greaterThan(0), function () {
                return `${asPercent} over`;
              }),
              Match.when(Number.lessThan(0), function () {
                return `${asPercent} short`;
              }),
              Match.orElse(() => ""),
            );
          }),
          Match.when("amount", function () {
            const asAmount = formatUSD(offset);

            return Match.value(offset).pipe(
              Match.when(Number.greaterThan(0), function () {
                return `${asAmount} over`;
              }),
              Match.when(Number.lessThan(0), function () {
                return `${asAmount} short`;
              }),
              Match.orElse(() => ""),
            );
          }),
          Match.orElseAbsurd,
        );

        return Match.value(splitsSum).pipe(
          Match.when(total, () => true),
          Match.orElse(() =>
            Match.value(view).pipe(
              Match.when(
                "percent",
                () => `Splits must sum to 100% (${remaining})`,
              ),
              Match.when(
                "amount",
                () => `Splits must sum to $${total} (${remaining})`,
              ),
              Match.orElseAbsurd,
            ),
          ),
        );
      }),
    );

    const Schema = S.Struct({
      description: S.String,
      date: S.DateFromSelf,
      amount: FormNumber.pipe(
        S.int(local.annotate("Amount must be a whole number")),
        S.greaterThan(0, local.annotate("Item must cost at least $0.01")),
        S.lessThan(100_000, local.annotate("Item must not exceed $100,000")),
      ),
      paidBy: S.Literal(...participants).pipe(
        S.annotations(local.annotate("Paid By must be a valid member")),
      ),
      splits: SplitsSchema,
    }).pipe(
      S.filter(
        (schema) =>
          schema.amount !== parseFloatCustom(initial.amount) ||
          schema.paidBy !== initial.paidBy ||
          schema.description !== initial.description ||
          schema.date.getTime() !== initial.date.getTime() ||
          !checkSplitsEqual(schema.splits, initial.splits),
        { message: () => "" },
      ),
    );

    return Schema;
  };

  const api = useAppForm({
    defaultValues: initial,
    validators: {
      onChange: (ctx) => {
        const total = parseFloatCustom(ctx.value.amount);
        const Schema = createSchema(total);
        const Standard = S.standardSchemaV1(Schema);

        return ctx.formApi.parseValuesWithSchema(Standard);
      },
      onSubmit: (ctx) => {
        return ctx.formApi.state.isPristine
          ? "Fields must be updated"
          : undefined;
      },
    },
    onSubmit: async (fields) => {
      const total = parseFloatCustom(fields.value.amount);
      const Schema = createSchema(total);
      const parse = S.decodeSync(Schema);

      const value = parse(fields.value);

      function makeExpense() {
        const keys = ["description", "amount", "date"] as const;

        const [description, amount, date] = keys.map(function isUpdated(key) {
          return value[key] !== initial[key];
        });

        if (!description && !amount && !date) return;

        return {
          ...(description && { description: value.description }),
          ...(amount && { amount: value.amount }),
          ...(date && { date: value.date.getTime() }),
        };
      }

      function makeParticipants() {
        type ParticipantUpdate = NonNullable<
          UpdateOptions["updates"]["participants"]
        >[number];

        const splitsEqual = checkSplitsEqual(value.splits, initial.splits);
        const paidByAltered = value.paidBy === initial.paidBy;

        if (splitsEqual && paidByAltered) return;

        const participants = value.splits.map((split) => {
          return {
            userId: split.memberUserId,
            split: fraction().from(split.amount, value.amount).get(),
            role: Match.value(split.memberUserId).pipe(
              Match.when(value.paidBy, () => "payer" as const),
              Match.orElse(() => "participant" as const),
            ),
          } satisfies ParticipantUpdate;
        });

        return participants;
      }

      leave();

      const result = await withToast({
        promise: () => {
          return updateMutation({
            expenseId: active.id,
            updates: {
              expense: makeExpense() ?? {},
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

export type SplitView = "percent" | "amount";

export function useSplitView(initial?: SplitView) {
  const [view, setView] = useState<SplitView>(initial ?? "percent");

  const toggle = () => setView((v) => (v === "percent" ? "amount" : "percent"));

  return { value: view, toggle };
}

type ExpenseSheetProps = PropsWithChildren<{
  expense: ExpenseWithParticipants;
}>;

export function ExpenseSheet(props: ExpenseSheetProps) {
  const auth = useAuthentication();
  const route = ExpenseSheetSearchRoute.useSearchRoute();
  const active = props.expense;
  const view = useSplitView();

  const payer = getPayerFromParticipants(active.participants);

  const mutators = useMutators();
  const form = useForm(
    active,
    mutators.expense.update,
    route.close,
    view.value,
  );
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
              <Separator className="col-span-full my-1.5 opacity-75" />
              <div className="col-span-full flex justify-between items-center">
                <p className={cn(sharedSheetLabelClassNames)}>Splits</p>
                <ul className="flex">
                  {(["percent", "amount"] as const).map((tab, index, array) => (
                    <Button
                      key={tab}
                      onClick={view.toggle}
                      type="button"
                      variant="link"
                      className={cn(
                        sharedSheetLabelClassNames,
                        "font-normal px-2 h-auto",
                        view.value === tab && "text-white font-medium",
                        view.value === tab && underline_defaults,
                        index === array.length - 1 && "pr-0",
                        index === 0 && "",
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
                children={(field) => (
                  <>
                    {field.state.value.map((split, index) => (
                      <form.api.AppField
                        key={split.memberUserId}
                        name={`splits[${index}]`}
                        children={(splitFieldContext) => (
                          // conditionally render either percent or amount at a time
                          // we nest this within top level splits[i] to access reactive values for alt display
                          <form.api.AppField
                            key={split.memberUserId + view.value}
                            name={
                              view.value === "percent"
                                ? `splits[${index}].percent`
                                : `splits[${index}].amount`
                            }
                            listeners={{
                              onBlur: () => {
                                const formatToTwoDecimals = (value: string) =>
                                  pipe(value, parseFloatCustom, toFixed2);

                                splitFieldContext.setValue((prev) => ({
                                  ...prev,
                                  amount: formatToTwoDecimals(prev.amount),
                                  percent: formatToTwoDecimals(prev.percent),
                                }));
                              },
                            }}
                            children={(fieldContext) => (
                              <div key={view.value} className="space-y-2">
                                <fieldContext.SheetSplitField
                                  symbol={view.value === "percent" ? "%" : "$"}
                                  altDisplay={
                                    view.value === "percent"
                                      ? `$${splitFieldContext.state.value.amount}`
                                      : `${splitFieldContext.state.value.percent}%`
                                  }
                                  errorPosition={positions.inline()}
                                  inputProps={{
                                    disabled: active.status === "settled",
                                    min: 0,
                                    step: 0.01,
                                    value: fieldContext.state.value,
                                    onChange: (e) => {
                                      const updateFn = updateSplit({
                                        key: view.value,
                                        value: e.target.value,
                                        total:
                                          fieldContext.form.state.values.amount,
                                      });

                                      splitFieldContext.setValue(updateFn);
                                    },
                                  }}
                                  label={split.memberName}
                                />
                              </div>
                            )}
                          />
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
