import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import * as v from "valibot";
import { ExpenseWithParticipants } from "./page";
import { createSearchRoute } from "@/lib/create-search-route";
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import {
  useDeleteExpense,
  useUpdateExpense,
  useUpdateExpenseParticipants,
} from "./@data";
import { FieldsErrors, useAppForm } from "@/components/form";
import { prevented, timestampToDate } from "@/lib/utils";
import {
  DeleteExpenseOptions,
  UpdateExpenseOptions,
} from "@/lib/data.mutators";
import { useStore } from "@tanstack/react-form";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { getPayerFromParticipants } from "@/lib/participants";
import { withToast } from "@/lib/mutate-with-toast";

const key = "expense" as const;
export const SearchRouteSchema = v.object({
  [key]: v.optional(v.string()),
});
export const SearchRoute = createSearchRoute(key);

function useMutators() {
  const updateExpense = useUpdateExpense();
  const updateExpenseParticipants = useUpdateExpenseParticipants();
  const deleteExpense = useDeleteExpense();

  return { updateExpense, updateExpenseParticipants, deleteExpense };
}

function useForm(
  active: ExpenseWithParticipants,
  updateExpenseMutation: (opts: UpdateExpenseOptions) => Promise<void>,
  // updateParticipantsMutation: (opts: UpdateExpenseOptions) => Promise<void>,
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
      paidBy: v.picklist(active.participants.map((p) => p.userId)),
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
      paidBy: getPayerFromParticipants(active.participants),
    },
    validators: {
      onChange: schema,
      onSubmit: (ctx) => {
        return ctx.formApi.state.isPristine
          ? "Fields must be updated"
          : undefined;
      },
    },
    listeners: {
      onChange(props) {
        console.log("onChange", props.formApi.state.values);
      },
    },
    onSubmit: async (fields) => {
      if (fields.formApi.state.isPristine) return;

      leave();

      const promise = withToast({
        promise: () => {
          return updateExpenseMutation({
            expenseId: active.id,
            updates: {
              description: fields.value.description,
              amount: fields.value.amount,
              date: fields.value.date.getTime(),
            },
          });
        },
        notify: {
          loading: "updating expense...",
          success: "Expense updated successfully",
          error: "Unable to update expense",
        },
      }).then(() => fields.formApi.reset());

      return promise;
    },
  });

  return { api };
}

function useConfirmAndDelete(
  expenseId: string,
  deleteMutation: (opts: DeleteExpenseOptions) => Promise<void>,
  leave: () => void
) {
  return useWithConfirmation({
    title: "Delete expense?",
    description: { type: "default", entity: "expense" },
    onConfirm: async () => {
      try {
        await deleteMutation({ expenseId });
        leave();
      } catch (error) {
        console.error("DELETE_ERROR", JSON.stringify(error, null, 2));
      }
    },
  });
}

type ExpenseSheetProps = PropsWithChildren<{
  expense: ExpenseWithParticipants;
}>;

export function ExpenseSheet(props: ExpenseSheetProps) {
  const route = SearchRoute.useSearchRoute();
  const active = props.expense;

  // const mutators = useMutators();
  const form = useForm(active, async () => {}, route.close);
  // const del = useConfirmAndDelete(
  //   active.id,
  //   mutators.deleteExpense,
  //   route.close
  // );

  console.log("rendering sheet");
  return (
    <>
      {/* <del.dialog /> */}
      <Sheet
        open={route.view() === "open"}
        onOpenChange={(opening) => {
          if (!opening) {
            route.close();
          }
        }}
      >
        <form
          className="h-full flex flex-col gap-2"
          onSubmit={prevented(() => void form.api.handleSubmit())}
        >
          <SheetContent
            className="bg-background border-sidebar-border/50"
            aria-describedby={undefined}
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
                <form.api.CancelButton onClick={route.close}>
                  Cancel
                </form.api.CancelButton>
              </form.api.AppForm>
            </SheetFooter>
          </SheetContent>
        </form>
      </Sheet>
    </>
  );
}
