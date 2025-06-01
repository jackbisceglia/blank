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
import { prevented, timestampToDate } from "@/lib/utils";
import {
  DeleteOptions as DeleteExpenseOptions,
  UpdateOptions as UpdateExpenseOptions,
} from "@/lib/mutators/expense-mutators";
import { PropsWithChildren } from "react";
import { Separator } from "@/components/ui/separator";
import { getPayerFromParticipants } from "@/lib/participants";
import { withToast } from "@/lib/toast";
import { Participant } from "@blank/zero";
import { useDeleteOneExpense, useUpdateExpense } from "../../@data/expenses";

const key = "expense" as const;
export const SearchRouteSchema = v.object({
  [key]: v.optional(v.string()),
});
export const SearchRoute = createSearchRoute(key);

function useConfirmDeleteExpense(
  expenseId: string,
  deleteMutation: (opts: DeleteExpenseOptions) => Promise<void>,
  leave: () => void
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
  leave: () => void
) {
  const schema = v.pipe(
    v.object({
      description: v.string(),
      amount: v.pipe(
        v.number(),
        v.minValue(0.01, "Item must cost at least $0.01"),
        v.maxValue(100_000, "Item must not exceed $100,000")
      ),
      date: v.date(),
      paidBy: v.picklist(
        active.participants.map((p) => p.userId),
        "paidBy must be a valid member"
      ),
    }),
    v.check((schema) => {
      return (
        schema.amount !== active.amount ||
        schema.description !== active.description ||
        schema.date.getTime() !== active.date ||
        schema.paidBy !== getPayerFromParticipants(active.participants)
      );
    })
  );

  const api = useAppForm({
    defaultValues: {
      description: active.description,
      amount: active.amount,
      date: timestampToDate(active.date),
      paidBy: getPayerFromParticipants(active.participants) ?? "",
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

        const payerId = getPayerFromParticipants(active.participants);

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
              participants: makeParticipants(),
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
  const route = SearchRoute.useSearchRoute();
  const active = props.expense;

  const mutators = useMutators();
  const form = useForm(active, mutators.expense.update, route.close);
  const deleteExpense = useConfirmDeleteExpense(
    active.id,
    mutators.expense.delete,
    route.close
  );

  return (
    <>
      <deleteExpense.dialog />
      <Sheet route={route}>
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
                    <field.SheetTextField label="description" />
                  )}
                />
              </div>
              <div className="col-span-1">
                <form.api.AppField
                  name="amount"
                  children={(field) => (
                    <field.SheetCostField label="Cost (USD)" />
                  )}
                />
              </div>
              <div className="col-span-1">
                <form.api.AppField
                  name="date"
                  children={(field) => <field.SheetDateField label="Date" />}
                />
              </div>

              <div className="col-span-2">
                <form.api.AppField
                  name="paidBy"
                  children={(field) => (
                    <field.SheetPaidByField
                      participants={active.participants}
                      label="Paid by"
                    />
                  )}
                />
              </div>
              <Separator className="col-span-full my-4" />
            </SheetBody>
            <SheetFooter className="flex-col gap-2 mt-auto">
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
                <form.api.SubmitButton>Save</form.api.SubmitButton>
                <form.api.CancelButton onClick={deleteExpense.confirm}>
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
