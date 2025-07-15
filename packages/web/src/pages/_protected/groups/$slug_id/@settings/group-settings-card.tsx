import { useAppForm } from "@/components/form";
import { withToast } from "@/lib/toast";
import { useUpdateGroup } from "../../../@data/groups";
import { slugify } from "@blank/core/lib/utils/index";
import { prevented } from "@/lib/utils";
import * as v from "valibot";
import { Group } from "@blank/zero";
import { positions } from "@/components/form/fields";

const schemas = {
  title: v.pipe(
    v.string(),
    v.minLength(1, "Title must not be empty"),
    v.maxLength(32, "Title must be at most 32 characters"),
    v.custom(
      (value) => slugify(value as string).isLossless(),
      "Title contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.",
    ),
  ),
  description: v.pipe(
    v.string(),
    v.minLength(1, "Description must not be empty"),
    v.maxLength(128, "Description must be at most 128 characters"),
  ),
};

const formSchema = v.object({
  title: schemas.title,
  description: schemas.description,
});

type GroupSettingsCardProps = {
  group: Group;
};

function useForm(group: Group) {
  const updateGroup = useUpdateGroup();

  const api = useAppForm({
    defaultValues: {
      title: group.title,
      description: group.description,
    },
    validators: { onChange: formSchema },
    onSubmit: async ({ value, formApi }) => {
      const hasChanges =
        value.title !== group.title || value.description !== group.description;

      if (!hasChanges) return;

      const promise = updateGroup({
        groupId: group.id,
        updates: value,
      });

      await withToast({
        promise,
        notify: {
          loading: "Updating group settings...",
          success: "Group settings updated successfully!",
          error: "Failed to update group settings",
        },
      });

      formApi.reset();
    },
  });

  return { api };
}

export function GroupSettingsCard({ group }: GroupSettingsCardProps) {
  const form = useForm(group);

  return (
    <div className="border rounded-md p-4 flex flex-col gap-3 h-full">
      <div>
        <h3 className="text-lg font-medium mb-1 uppercase">
          Group Information
        </h3>
        <p className="text-sm text-muted-foreground mb-2 lowercase">
          Update your group's basic information and settings.
        </p>
      </div>

      <form
        onSubmit={prevented(() => void form.api.handleSubmit())}
        className="flex flex-col h-full gap-1.5"
      >
        <form.api.AppField
          name="title"
          children={(field) => (
            <>
              <field.TextField
                label="Group Name"
                errorPosition={positions.inline()}
                labelProps={{
                  className: "mt-0.5",
                }}
                inputProps={{
                  placeholder: "Enter group name",
                  className:
                    "bg-transparent border border-border hover:bg-secondary/25 text-foreground placeholder:text-foreground/40 flex-0",
                }}
              />
            </>
          )}
        />

        <form.api.AppField
          name="description"
          children={(field) => (
            <>
              <field.TextField
                label="Description"
                errorPosition={positions.inline()}
                inputProps={{
                  placeholder: "Enter group description",
                  className:
                    "bg-transparent border border-border hover:bg-secondary/25 text-foreground placeholder:text-foreground/40 flex-0",
                }}
                labelProps={{
                  className: "mt-0.5",
                }}
              />
            </>
          )}
        />

        <div className="mb-0 mt-auto pt-3">
          <form.api.AppForm>
            <form.api.SubmitButton dirty={{ disableForAria: true }}>
              Update Group
            </form.api.SubmitButton>
          </form.api.AppForm>
        </div>
      </form>
    </div>
  );
}
