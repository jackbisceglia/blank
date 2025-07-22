import { useAppForm } from "@/components/form";
import { withToast } from "@/lib/toast";
import { prevented } from "@/lib/utils";
import * as v from "valibot";
import { positions } from "@/components/form/fields";
import { useMutation } from "@tanstack/react-query";
import { updateUserServerFn } from "@/server/user.route";
import { useInvalidate } from "@/lib/query";
import { useAuthentication } from "@/lib/authentication";

type Data = { name: string; image: string };

const constraints = {
  name: { minLength: 1, maxLength: 64 },
  image: { minLength: 1, maxLength: 2048 },
};

const schemas = {
  name: v.pipe(
    v.string(),
    v.minLength(constraints.name.minLength, "Name must not be empty"),
    v.maxLength(
      constraints.name.maxLength,
      `Name must be at most ${constraints.name.maxLength} characters`,
    ),
  ),
  image: v.pipe(
    v.string(),
    v.minLength(constraints.name.minLength, "Image URL must not be empty"),
    v.maxLength(
      constraints.image.maxLength,
      `Image URL must be at most ${constraints.image.maxLength} characters`,
    ),
    v.url("Image must be a valid URL"),
  ),
};

const formSchemaNotStale = (init: Data) =>
  v.pipe(
    v.object({ name: schemas.name, image: schemas.image }),
    v.check(
      (data) => JSON.stringify(data) !== JSON.stringify(init),
      "These details are already set",
    ),
  );

type AccountSettingsFormProps = { user: Data };

function AccountSettingsForm(props: AccountSettingsFormProps) {
  const invalidate = useInvalidate();
  const update = useMutation({
    mutationFn: (data: Data) => updateUserServerFn({ data }),
    onSuccess: () => invalidate("authentication"),
  });

  const schema = formSchemaNotStale(props.user);

  const form = useAppForm({
    defaultValues: props.user,
    validators: { onChange: schema },
    onSubmit: async (options) => {
      const result = await withToast({
        promise: () => update.mutateAsync(options.value),
        finally: () => options.formApi.reset(),
        notify: {
          loading: "Updating user settings...",
          success: "User settings updated successfully!",
          error: "Failed to update user settings",
        },
      });

      return result;
    },
  });

  return (
    <form
      onSubmit={prevented(() => void form.handleSubmit())}
      className="flex flex-col h-full gap-1.5"
    >
      <form.AppField
        name="name"
        listeners={{
          onChange: (ctx) => {
            if (ctx.value === props.user.name) {
              form.resetField("name");
            }
          },
        }}
        children={(field) => (
          <field.TextField
            label="Username"
            errorPosition={positions.inline()}
            labelProps={{
              className: "mt-0.5",
            }}
            inputProps={{
              minLength: constraints.name.minLength,
              maxLength: constraints.name.maxLength,
              placeholder: "Enter your username",
              className:
                "bg-transparent border border-border hover:bg-secondary/25 text-foreground placeholder:text-foreground/40 flex-0",
            }}
          />
        )}
      />

      <form.AppField
        name="image"
        listeners={{
          onChange: (ctx) => {
            if (ctx.value === props.user.image) {
              form.resetField("image");
            }
          },
        }}
        children={(field) => (
          <field.TextField
            label="Profile Image URL"
            errorPosition={positions.inline()}
            inputProps={{
              minLength: constraints.image.minLength,
              maxLength: constraints.image.maxLength,
              placeholder: "Enter profile image URL",
              className:
                "bg-transparent border border-border hover:bg-secondary/25 text-foreground placeholder:text-foreground/40 flex-0",
            }}
            labelProps={{
              className: "mt-1.5",
            }}
          />
        )}
      />

      <div className="mb-0 mt-auto pt-3.5">
        <form.AppForm>
          <form.SubmitButton dirty={{ disableForAria: true }}>
            Update User
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}

export function AccountSettingsCard() {
  const authentication = useAuthentication();

  return (
    <div className="border rounded-md p-4 flex flex-col gap-3 h-full">
      <div>
        <h3 className="text-lg font-medium mb-1 uppercase">User Information</h3>
        <p className="text-sm text-muted-foreground mb-2 lowercase">
          Update your username and profile image.
        </p>
      </div>
      <AccountSettingsForm user={authentication.user} />
    </div>
  );
}
