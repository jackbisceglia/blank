import {
  createFileRoute,
  Link,
  LinkOptions,
  Navigate,
  notFound,
  useRouter,
} from "@tanstack/react-router";
import * as v from "valibot";
import { useAuthentication } from "@/lib/authentication";
import { withToast } from "@/lib/toast";
import {
  fromParsedEffect,
  isTaggedError,
  TaggedError,
} from "@blank/core/lib/effect/index";
import { FieldsErrors, useAppForm } from "@/components/form";
import { prevented } from "@/lib/utils";
import { Effect, Exit, Match, pipe } from "effect";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { joinGroupServerFn } from "@/server/invite.route";
import { transformSlugAndId } from "@/lib/slug_id";
import {
  DefaultCatchBoundary,
  DefaultFallbackError,
} from "@/components/default-catch-boundary";
import { slugify } from "@blank/core/lib/utils/index";
import { useStore } from "@tanstack/react-form";
import { positions } from "@/components/form/fields";
import { useGroupById } from "../@data/groups";
import { States } from "./$slug_id/layout";

const PageErrors = {
  GroupDoesNotExist: class _ extends TaggedError("GroupDoesNotExistError") {},
  UserAlreadyAMember: class _ extends TaggedError("UserAlreadyAMemberError") {},
} as const;

type PageErrorTypes = InstanceType<
  (typeof PageErrors)[keyof typeof PageErrors]
>;

const toGroupPageOpts = (id: string, slug: string) =>
  ({
    to: "/groups/$slug_id",
    params: { slug_id: { id, slug } },
  }) satisfies LinkOptions;

const InviteToken = v.pipe(v.string(), v.uuid());

const schema = v.object({
  nickname: v.pipe(
    v.string("Nickname is required"),
    v.minLength(1, "Nickname is required"),
    v.maxLength(50, "Nickname must be at most 50 characters"),
  ),
});

function useJoinGroup(token: string, groupId: string) {
  const joinMutation = useMutation({
    mutationKey: ["join"],
    mutationFn: (nickname: string) =>
      joinGroupServerFn({
        data: {
          token,
          groupId,
          nickname: nickname.trim(),
        },
      }),
  });

  const handleJoinGroup = async (nickname: string) => {
    const promise = joinMutation.mutateAsync(nickname);

    await withToast({
      promise,
      notify: {
        loading: "Joining group...",
        success: "Successfully joined group!",
        error: "Failed to join group",
      },
    });

    return await promise;
  };

  return {
    handler: handleJoinGroup,
    mutation: joinMutation,
  };
}

function useForm(token: string, groupId: string) {
  const auth = useAuthentication();
  const joinGroup = useJoinGroup(token, groupId);

  const api = useAppForm({
    defaultValues: { nickname: auth.user.name },
    validators: { onChange: schema },
    onSubmit: async (fields) => {
      return await joinGroup.handler(fields.value.nickname);
    },
  });

  const state = useStore(api.store, (s) => [
    s.isSubmitting,
    s.isSubmitSuccessful,
  ]);

  const status = Match.value(state).pipe(
    Match.when(
      ([submitting, success]) => !success && !submitting,
      () => "idle" as const,
    ),
    Match.when(
      ([submitting, _]) => submitting,
      () => "submitting" as const,
    ),
    Match.when(
      ([_, success]) => success,
      () => "success" as const,
    ),
    Match.orElseAbsurd,
  );

  return { api, status };
}

function JoinGroupPage() {
  const router = useRouter();
  const loader = Route.useLoaderData();
  const params = Route.useParams({ select: (p) => p.slug_id });
  const group = useGroupById(params.id);
  const form = useForm(loader.token, params.id);
  const linkOpts = toGroupPageOpts(params.id, params.slug);

  // we're safe to navigate whenever the group reactively syncs (means we've joined it)
  if (group.status === "loading")
    return <States.Loading loading={group.status === "loading"} />;

  if (group.status === "success" && group.data) {
    if (form.api.state.isSubmitSuccessful) {
      return <Navigate {...linkOpts} />;
    } else {
      const message = `You're already a member of ${group.data.title}`;

      throw new PageErrors.UserAlreadyAMember(message, params);
    }
  }

  const fieldErrorId = `nickname-error`;

  return (
    <div className="flex flex-col items-center justify-center p-4 mx-auto mb-auto mt-32 w-full max-w-2xl">
      <h1 className="text-xl font-semibold uppercase">
        {slugify(params.slug).decode()}
      </h1>
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
              errorPosition={positions.custom({ elementId: fieldErrorId })}
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
          <form.api.SubmitButton
            disabled={
              form.status === "submitting" ||
              (form.status === "success" && !group.data)
            }
            onPointerOver={() => router.preloadRoute(linkOpts)}
            onFocus={() => router.preloadRoute(linkOpts)}
            className="col-start-1 -col-end-1"
          >
            Join Group
          </form.api.SubmitButton>
        </form.api.AppForm>
        <form.api.Subscribe
          selector={(state) => state.fieldMeta}
          children={(fieldMeta) => (
            <FieldsErrors
              id={fieldErrorId}
              ul={{ className: "col-span-full min-h-9" }}
              metas={fieldMeta}
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
  "/_protected/groups/$slug_id_/join/$token/",
)({
  errorComponent: (props) => {
    if (!isTaggedError<PageErrorTypes>(props.error)) {
      return <DefaultFallbackError />;
    }

    return Match.value(props.error._tag).pipe(
      Match.when("UserAlreadyAMemberError", () => (
        <DefaultCatchBoundary
          reset={() => {}}
          group={props.error.cause as { id: string; slug: string }}
          error={new Error(props.error.message)}
        />
      )),
      Match.orElse(() => <DefaultFallbackError />),
    );
  },
  component: JoinGroupPage,
  validateSearch: v.object({}),
  params: {
    parse: (params) => ({
      ...params,
      ...transformSlugAndId.parse(params),
    }),
    stringify: (params) => ({
      ...params,
      ...transformSlugAndId.stringify(params),
    }),
  },
  loader: async ({ params }) => {
    const token = pipe(
      fromParsedEffect(InviteToken, params.token),
      Effect.runSyncExit,
      Exit.match({
        onSuccess: (token) => token,
        onFailure: () => notFound({ throw: true }) as never,
      }),
    );

    if (!params.slug_id.id) {
      throw notFound();
    }

    return { crumb: "Join Group", token };
  },
});
