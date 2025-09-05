import { useAppForm } from "@/components/form";
import { withToast } from "@/lib/toast";
import { prevented } from "@/lib/utils";
import * as v from "valibot";
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  getUserPreferencesServerFn,
  updateDefaultGroupServerFn,
} from "@/server/preferences.route";
import { Suspense } from "react";
import { key, useInvalidate } from "@/lib/query";
import { Loading } from "@/components/loading";

type Data = { defaultGroupId: string };

const formSchemaNotStale = (init: Data) =>
  v.object({
    defaultGroupId: v.pipe(
      v.string(),
      v.uuid("Default group must be selected"),
      v.check(
        (data) => data !== init.defaultGroupId,
        "This preferred group is already set",
      ),
    ),
  });

export function userPreferencesQueryOptions() {
  return queryOptions({
    queryKey: key("userPreferences"),
    queryFn: getUserPreferencesServerFn,
  });
}

function AppPreferencesForm() {
  const invalidate = useInvalidate();
  const query = useSuspenseQuery(userPreferencesQueryOptions());
  const update = useMutation({
    mutationFn: (data: Data) => updateDefaultGroupServerFn({ data }),
    onSuccess: async () => invalidate("userPreferences"),
  });

  if (!query.data) {
    return <p className="lowercase text-xs">Trouble fetching preferences</p>;
  }

  const init = { defaultGroupId: query.data.defaultGroupId ?? "" };

  const schema = formSchemaNotStale(init);

  const form = useAppForm({
    defaultValues: init,
    validators: { onChange: schema },
    onSubmit: async (options) => {
      const result = await withToast({
        promise: () => update.mutateAsync(options.value),
        finally: () => options.formApi.reset(),
        notify: {
          loading: "Updating preferences...",
          success: "Preferences updated successfully!",
          error: "Failed to update preferences",
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
        listeners={{
          onChange: (ctx) => {
            if (ctx.value === init.defaultGroupId) {
              form.resetField("defaultGroupId");
            }
          },
        }}
        name="defaultGroupId"
        children={(field) => (
          <field.DefaultGroupSelectField
            label="Default Group"
            labelProps={{ className: "mt-0.5" }}
            triggerProps={{ className: "lowercase" }}
            itemProps={{ className: "lowercase" }}
          />
        )}
      />

      <div className="mb-0 mt-auto pt-3.5">
        <form.AppForm>
          <form.SubmitButton dirty={{ disableForAria: true }}>
            Update Preferences
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}

export function AppPreferencesCard() {
  // temp solution until a proper skeleton is added
  const fallback = <Loading omitBaseText className="my-4" />;

  return (
    <div className="border p-4 flex flex-col gap-3 h-full">
      <div>
        <h3 className="text-base font-medium mb-1 uppercase">Preferences</h3>
        <p className="text-sm text-muted-foreground mb-2 lowercase">
          Set your default group for new expenses.
        </p>
      </div>

      <Suspense fallback={fallback}>
        <AppPreferencesForm />
      </Suspense>
    </div>
  );
}
