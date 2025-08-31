import { useAuthentication } from "@/lib/authentication";
import { PropsWithChildren } from "react";
import { useUserDefaultGroup } from "../@data/users";
import { useGroupListByUserId } from "../@data/groups";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCreateExpense } from "../@data/expenses";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { prevented } from "@/lib/utils";
import { useAppForm } from "@/components/form";
import { withToast } from "@/lib/toast";
import * as v from "valibot";
import SearchRoute from "./route";
import { positions } from "@/components/form/fields";
import { FieldsErrors } from "@/components/form/errors";

export const schema = v.object({
  description: v.pipe(
    v.string("Description is required"),
    v.minLength(1, `Description is required`),
    v.maxLength(180, `Description must be at most 180 characters`),
  ),
});

function useGroupFromSearch() {
  const params = useParams({ strict: false });

  const isObject = typeof params.slug_id !== "string";

  return isObject ? params.slug_id : undefined;
}

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

function DialogInner(props: PropsWithChildren) {
  const authentication = useAuthentication();
  const groupFromSearch = useGroupFromSearch();
  const defaultGroup = useUserDefaultGroup(authentication.user.id);
  const groupsList = useGroupListByUserId(authentication.user.id);
  const navigate = useNavigate();
  const create = useCreateExpense(
    (groupFromSearch ?? defaultGroup.data ?? groupsList.data?.at(0))?.id,
  );
  const route = SearchRoute.useSearchRoute({
    hooks: {
      onClose: () => {
        setTimeout(() => form.api.reset(), 0);
      },
      onOpen: async () => {
        const defaultGroupMissing = defaultGroup.status === "not-found";
        const groupListEmpty = groupsList.status === "empty";

        if (defaultGroupMissing && groupListEmpty) {
          toast.message("Cannot create expense until a group is created", {
            id: "block-create-expense",
          });

          await navigate(route.closeLinkOptions());
        }
      },
    },
  });

  const form = useForm({
    create: create,
    close: route.close,
    open: route.open,
    view: route.view,
  });

  const fieldErrorsId = "create-expense-errors";

  if (!route.hooksDidRun) return;

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
                errorPosition={positions.custom({ elementId: fieldErrorsId })}
                label="Expense Description"
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
                id={fieldErrorsId}
                ul={{ className: "col-span-full min-h-32" }}
                metas={fieldMeta}
              />
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateExpenseDialog(props: PropsWithChildren) {
  const authentication = useAuthentication();
  const defaultGroup = useUserDefaultGroup(authentication.user.id);
  const groupsList = useGroupListByUserId(authentication.user.id);

  const isLoading =
    defaultGroup.status === "loading" || groupsList.status === "loading";

  if (isLoading) return null;

  return <DialogInner {...props} />;
}
