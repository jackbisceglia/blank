import { useAppForm, FieldsErrors } from "@/components/form";
import { withToast } from "@/lib/toast";
import { useUpdateGroup } from "../../../@data/groups";
import { slugify } from "@blank/core/lib/utils/index";
import { prevented } from "@/lib/utils";
import * as v from "valibot";
import { Group } from "@blank/zero";
import { Route } from "../settings.page";

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

function useForm(group: Group, leave: (name: string) => void) {
  const updateGroup = useUpdateGroup();

  const api = useAppForm({
    defaultValues: {
      title: group.title,
      description: group.description,
    },
    validators: { onChange: formSchema },
    onSubmit: async ({ value }) => {
      const hasChanges =
        value.title !== group.title || value.description !== group.description;

      if (!hasChanges) return;

      const promise = updateGroup({
        groupId: group.id,
        updates: value,
      });

      leave(value.title);

      await withToast({
        promise,
        notify: {
          loading: "Updating group settings...",
          success: "Group settings updated successfully!",
          error: "Failed to update group settings",
        },
      });
    },
  });

  return { api };
}

export function GroupSettingsCard({ group }: GroupSettingsCardProps) {
  const navigate = Route.useNavigate();
  const leave = (name: string) => {
    const params = { id: group.id, slug: slugify(name).encode() };

    void navigate({
      to: "/groups/$slug_id/settings",
      params: { slug_id: params },
    });
  };

  const form = useForm(group, leave);

  return (
    <div className="border rounded-md p-4 flex flex-col gap-3 h-full">
      <div>
        <h3 className="text-lg font-medium mb-1 uppercase">
          Group Information
        </h3>
        <p className="text-sm text-muted-foreground mb-3 lowercase">
          Update your group's basic information and settings.
        </p>
      </div>

      <form
        onSubmit={prevented(() => void form.api.handleSubmit())}
        className="flex flex-col gap-3"
      >
        <form.api.AppField
          name="title"
          children={(field) => (
            <>
              <field.TextField
                label="Group Name"
                inputProps={{
                  placeholder: "Enter group name",
                }}
              />
            </>
          )}
        />

        <form.api.AppField
          name="description"
          children={(field) => (
            <field.TextField
              label="Description"
              inputProps={{
                placeholder: "Enter group description",
              }}
            />
          )}
        />

        <form.api.AppForm>
          <form.api.SubmitButton dirty={{ disableForAria: true }}>
            Update Group
          </form.api.SubmitButton>
        </form.api.AppForm>

        <form.api.Subscribe
          selector={(state) => state.fieldMeta}
          children={(fieldMeta) =>
            Object.values(fieldMeta) && (
              <FieldsErrors
                className="min-h-0 p-0"
                metas={Object.values(fieldMeta)}
              />
            )
          }
        />
      </form>
    </div>
  );
}
