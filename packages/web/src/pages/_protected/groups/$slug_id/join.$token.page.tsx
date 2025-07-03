import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import * as v from "valibot";
import { useZero } from "@/lib/zero";
import { useAuthentication } from "@/lib/authentication";
import { withToast } from "@/lib/toast";
import { fromParsedEffect } from "@blank/core/lib/effect/index";
import { FieldsErrors, useAppForm } from "@/components/form";
import { prevented } from "@/lib/utils";
import { Console, Effect, Exit, pipe } from "effect";
import { Button } from "@/components/ui/button";

const InviteToken = v.pipe(v.string(), v.uuid());

const schema = v.object({
  nickname: v.pipe(
    v.string("Nickname is required"),
    v.minLength(1, "Nickname is required"),
    v.maxLength(50, "Nickname must be at most 50 characters"),
  ),
});

function useForm(token: string, leave: () => void) {
  const auth = useAuthentication();
  const zero = useZero();

  const api = useAppForm({
    defaultValues: { nickname: auth.user.name },
    validators: { onChange: schema },
    onSubmit: async (fields) => {
      const promise = await withToast({
        promise: () =>
          zero.mutate.group.joinWithInvite({
            token,
            userId: auth.user.id,
            nickname: fields.value.nickname.trim(),
          }),
        notify: {
          loading: "Joining group...",
          success: "Successfully joined group!",
          error: "Failed to join group",
        },
      }).then(() => leave());

      return promise;
    },
  });

  return { api };
}

function JoinGroupPage() {
  const loader = Route.useLoaderData();
  const navigate = useNavigate();

  const form = useForm(loader.token, () => void navigate({ to: "/groups" }));

  return (
    <div className="flex flex-col items-center justify-center p-4 mx-auto mb-auto mt-32 w-full max-w-2xl">
      <h1 className="text-xl font-semibold uppercase">MOCK GROUP NAME</h1>
      <p className="text-muted-foreground lowercase text-sm">
        you've been invited to join this group
      </p>

      <form
        className="grid grid-rows-3 grid-cols-6 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1.5px] items-center gap-2.5 p-2 border-[1.5px] border-none bg-transparent [&>div>input]:h-6 h-fit w-full pb-6 pt-4"
        onSubmit={prevented(() => void form.api.handleSubmit())}
      >
        <form.api.AppField
          name="nickname"
          children={(field) => (
            <field.TextField
              label="Nickname"
              inputProps={{
                placeholder: "enter your nickname",
                className:
                  "bg-transparent border border-border hover:bg-secondary/25 py-1 h-min text-xs text-foreground",
              }}
            />
          )}
        />
        <form.api.AppForm>
          <form.api.SubmitButton className="col-start-1 -col-end-1">
            Join Group
          </form.api.SubmitButton>
        </form.api.AppForm>
        <form.api.Subscribe
          selector={(state) => state.fieldMeta}
          children={(fieldMeta) => (
            <FieldsErrors
              className="col-span-full min-h-9"
              metas={Object.values(fieldMeta)}
            />
          )}
        />
      </form>

      <Button asChild variant="link" className="font-normal">
        <Link to="/groups">Back to Groups</Link>
      </Button>
    </div>
  );
}

export const Route = createFileRoute(
  "/_protected/groups/$slug_id/join/$token/",
)({
  ssr: false,
  component: JoinGroupPage,
  validateSearch: v.object({}),
  loader: async ({ params }) => {
    const token = pipe(
      fromParsedEffect(InviteToken, params.token),
      Effect.tapError((e) => Console.log(`Validation Error [${e._tag}]: ${e}`)),
      Effect.runSyncExit,
      Exit.match({
        onSuccess: (token) => token,
        onFailure: () => notFound({ throw: true }) as never,
      }),
    );

    return { crumb: "Join Group", token };
  },
});
