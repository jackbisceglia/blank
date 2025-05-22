import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as v from "valibot";
import { useCreateExpense } from "./@data";
import { ok } from "neverthrow";
import { toast } from "sonner";
import { FieldsErrors, prevented, useAppForm } from "@/lib/form";
import { useStore } from "@tanstack/react-form";
import { unwrapOrThrow } from "@blank/core/utils";
import { createStackableSearchRoute } from "@/lib/create-search-route";

const ENTRY = "new-expense" as const;
export const SearchRoute = createStackableSearchRoute("action", ENTRY);
export type SearchRouteSchema = v.InferOutput<typeof SearchRouteSchema>;
export const SearchRouteSchema = v.object({
  action: v.literal(ENTRY),
});

const schema = v.object({
  description: v.pipe(
    v.string("Description is required"),
    v.minLength(1, `Description is required`),
    v.maxLength(180, `Description must be at most 180 characters`)
  ),
});

type HandleSubmitOptions = {
  closeDialog: () => void;
  resetForm: () => void;
  createExpense: ReturnType<typeof useCreateExpense>;
};

function handleSubmit(value: string, options: HandleSubmitOptions) {
  const submission = ok(value) // unresolved promise
    .andTee(options.closeDialog)
    .asyncAndThen((description) => {
      return options.createExpense(description);
    })
    .andTee(() => {
      options.resetForm();
    });

  toast.promise(unwrapOrThrow(submission), {
    loading: "Creating expense...",
    success: { message: "Expense created successfully" },
    error: (e) => ({
      message: "Unable to create expense",
      description: e instanceof Error ? e.message : "Unknown error occurred",
    }),
  });

  return submission; // return promise so the form track/sync submission state
}

type CreateExpenseFormProps = {
  closeDialog: () => void;
  createExpense: ReturnType<typeof useCreateExpense>;
};

function CreateExpenseForm(props: CreateExpenseFormProps) {
  const form = useAppForm({
    defaultValues: { description: "" },
    onSubmit: async (fields) => {
      await handleSubmit(fields.value.description, {
        closeDialog: props.closeDialog,
        resetForm: form.reset,
        createExpense: props.createExpense,
      });
    },
    validators: { onChange: schema },
  });

  const fieldMetas = useStore(form.store, (store) => store.fieldMeta);

  return (
    <form
      className="grid grid-rows-3 grid-cols-6 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1.5px] items-center gap-2.5 p-2 border-[1.5px] border-none bg-transparent [&>div>input]:h-6 h-fit"
      onSubmit={prevented(() => void form.handleSubmit())}
    >
      <form.AppField
        name="description"
        children={(field) => (
          <field.TextField
            label="Description"
            inputProps={{
              placeholder: "enter description",
            }}
          />
        )}
      />
      <form.AppForm>
        <form.SubmitButton>Submit</form.SubmitButton>
        <form.CancelButton onClick={props.closeDialog}>
          Cancel
        </form.CancelButton>
        <FieldsErrors
          className="col-span-full"
          metas={Object.values(fieldMetas)}
        />
      </form.AppForm>
    </form>
  );
}

export function CreateExpenseDialog() {
  const createExpense = useCreateExpense();
  const route = SearchRoute.useSearchRoute();

  return (
    <Dialog
      open={route.view() === "open"}
      onOpenChange={(bool) => {
        (bool ? route.open : route.close)();
      }}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>Create New Group</DialogTitle>
      </DialogHeader>
      <DialogContent
        aria-describedby={undefined}
        omitCloseButton
        className="bg-transparent border-none shadow-none sm:max-w-2xl outline-none"
      >
        <CreateExpenseForm
          closeDialog={route.close}
          createExpense={createExpense}
        />
      </DialogContent>
    </Dialog>
  );
}
