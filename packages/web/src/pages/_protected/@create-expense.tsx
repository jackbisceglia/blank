import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDialogFromUrl } from "@/lib/dialog";
import * as v from "valibot";
import { useCreateExpense } from "./@data";
import { ok } from "neverthrow";
import { toast } from "sonner";
import { FieldsErrors, useAppForm } from "@/lib/form";
import { useStore } from "@tanstack/react-form";
import { unwrapOrThrow } from "@blank/core/utils";

export const CreateExpenseSearchParams = v.object({
  action: v.literal("new-expense"),
});

export type CreateExpenseSearchParams = v.InferOutput<
  typeof CreateExpenseSearchParams
>;

const schema = v.object({
  description: v.pipe(
    v.string("Description is required"),
    v.minLength(1, `Description is required`),
    v.maxLength(180, `Description must be at most 180 characters`)
  ),
});

type CreateExpenseFormProps = {
  closeDialog: () => void;
  createExpense: ReturnType<typeof useCreateExpense>;
};

function CreateExpenseForm(props: CreateExpenseFormProps) {
  const form = useAppForm({
    defaultValues: { description: "" },
    onSubmit: (fields) => handleSubmit(fields.value.description),
    validators: { onChange: schema },
  });

  const meta = useStore(form.store, (store) => store.fieldMeta);

  function handleSubmit(value: string) {
    const creatingExpense = ok(value)
      .andTee(props.closeDialog)
      .asyncAndThen((description) => {
        return props.createExpense(description);
      });

    toast.promise(unwrapOrThrow(creatingExpense), {
      loading: "Creating expense...",
      success: {
        type: "success",
        message: "Expense created successfully",
      },
      error: (error: unknown) => ({
        type: "error",
        message: "Unable to create expense",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
    });
  }

  return (
    <form
      className="grid grid-rows-3 grid-cols-6 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1.5px] items-center gap-2.5 p-2 border-[1.5px] border-none bg-transparent [&>div>input]:h-6 h-fit"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField
        name="description"
        children={(field) => (
          <field.TextField
            label="Description"
            labelProps={{}}
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

        <FieldsErrors className="col-span-full" metas={Object.values(meta)} />
      </form.AppForm>
    </form>
  );
}

export function CreateExpenseDialog() {
  const createExpense = useCreateExpense();
  const view = useDialogFromUrl({ schema: CreateExpenseSearchParams });
  const isOpen = view.state() === "open";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(bool) => {
        (bool ? view.open : view.close)();
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
          closeDialog={view.close}
          createExpense={createExpense}
        />
      </DialogContent>
    </Dialog>
  );
}
