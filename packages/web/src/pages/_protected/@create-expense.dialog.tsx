import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as v from "valibot";
import { useCreateExpense } from "./@data/expenses";
import { FieldsErrors, useAppForm } from "@/components/form";
import { createStackableSearchRoute } from "@/lib/search-route";
import { prevented } from "@/lib/utils";
import { withToast } from "@/lib/toast";
import { PropsWithChildren } from "react";

const KEY = "action" as const;
const ENTRY = "new-expense" as const;
export const SearchRoute = createStackableSearchRoute(KEY, ENTRY);
export type SearchRouteSchema = v.InferOutput<typeof SearchRouteSchema>;
export const SearchRouteSchema = v.object({
  action: v.literal(ENTRY),
});

const schema = v.object({
  description: v.pipe(
    v.string("Description is required"),
    v.minLength(1, `Description is required`),
    v.maxLength(180, `Description must be at most 180 characters`),
  ),
});

type UseFormOptions = {
  close: () => void;
  open: () => void;
  view: () => "open" | "closed";
  create: ReturnType<typeof useCreateExpense>;
};

function useForm(options: UseFormOptions) {
  const api = useAppForm({
    defaultValues: { description: "" },
    validators: {
      onChange: ({ formApi }) => {
        if (options.view() === "closed") return;
        return formApi.parseValuesWithSchema(schema);
      },
    },
    onSubmit: async (fields) => {
      const value = fields.value.description;

      options.close();

      const promise = withToast({
        promise: () => options.create(value),
        notify: {
          loading: "Creating expense...",
          success: "Expense created successfully",
          error: "Unable to create expense",
        },
      }).catch(() => {
        options.open();
        api.setFieldValue("description", value);
      });

      return promise;
    },
  });

  return { api };
}

export function CreateExpenseDialog(props: PropsWithChildren) {
  const create = useCreateExpense();
  const route = SearchRoute.useSearchRoute({
    hooks: {
      onClose: () => {
        setTimeout(() => form.api.reset(), 0);
      },
    },
  });

  const form = useForm({
    create: create,
    close: route.close,
    open: route.open,
    view: route.view,
  });

  return (
    <Dialog open={route.view() === "open"} onOpenChange={route.sync}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogHeader className="sr-only">
        <DialogTitle>Create New Group</DialogTitle>
      </DialogHeader>
      <DialogContent
        aria-describedby={undefined}
        omitCloseButton
        className="bg-transparent border-none shadow-none sm:max-w-2xl outline-none"
      >
        <form
          className="grid grid-rows-3 grid-cols-6 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1.5px] items-center gap-2.5 p-2 border-[1.5px] border-none bg-transparent [&>div>input]:h-6 h-fit"
          onSubmit={prevented(() => void form.api.handleSubmit())}
        >
          <form.api.AppField
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
          <form.api.AppForm>
            <form.api.SubmitButton dirty={{ disableForAria: true }}>
              Submit
            </form.api.SubmitButton>
            <form.api.CancelButton onClick={route.close}>
              Cancel
            </form.api.CancelButton>
          </form.api.AppForm>
          <form.api.Subscribe
            selector={(state) => state.fieldMeta}
            children={(fieldMeta) => (
              <FieldsErrors
                className="col-span-full min-h-32 "
                metas={Object.values(fieldMeta)}
              />
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
