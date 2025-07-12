import {
  createFileRoute,
  Link,
  LinkOptions,
  notFound,
  useNavigate,
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
import { Console, Effect, Exit, Match, pipe } from "effect";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { joinGroupServerFn } from "@/server/invite.route";
import { useGroupById } from "../@data/groups";
import { transformSlugAndId } from "@/lib/slug_id";
import { DefaultCatchBoundary } from "@/components/default-catch-boundary";
import { slugify } from "@blank/core/lib/utils/index";
import { useStore } from "@tanstack/react-form";

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

function useForm(token: string, groupId: string, leave: () => void) {
  const auth = useAuthentication();
  const joinGroup = useJoinGroup(token, groupId);

  const api = useAppForm({
    defaultValues: { nickname: auth.user.name },
    validators: { onChange: schema },
    onSubmit: async (fields) => {
      await joinGroup.handler(fields.value.nickname);

      leave();

      return;
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
  const params = Route.useParams();
  const navigate = useNavigate();

  const auth = useAuthentication();
  const group = useGroupById(params.slug_id.id);

  const linkOpts = toGroupPageOpts(
    group.data?.id ?? "",
    group.data?.slug ?? "",
  );

  const form = useForm(
    loader.token,
    group.data?.id ?? "",
    () => void navigate(linkOpts),
  );

  if (group.status === "loading") return null;

  if (!group.data) {
    throw new PageErrors.GroupDoesNotExist(
      `Group ${params.slug_id.slug} does not exist`,
    );
  }

  const isMember = group.data.members.find((m) => m.userId === auth.user.id);

  if (isMember && form.status === "idle") {
    throw new PageErrors.UserAlreadyAMember(
      `You are already a member of group ${params.slug_id.slug}`,
      { id: group.data.id, slug: group.data.slug },
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 mx-auto mb-auto mt-32 w-full max-w-2xl">
      <h1 className="text-xl font-semibold uppercase">
        {slugify(params.slug_id.slug).decode()}
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
            disabled={form.status !== "idle"}
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
  "/_protected/groups/$slug_id_/join/$token/",
)({
  errorComponent: (props) => {
    const Fallback = () => (
      <DefaultCatchBoundary
        reset={() => {}}
        error={
          new Error(
            "Uh Oh. Something unexpected happened trying to join this group",
          )
        }
      />
    );

    if (!isTaggedError<PageErrorTypes>(props.error)) return <Fallback />;

    return Match.value(props.error._tag).pipe(
      Match.when("GroupDoesNotExistError", () => (
        <DefaultCatchBoundary
          reset={() => {}}
          error={new Error(props.error.message)}
        />
      )),
      Match.when("UserAlreadyAMemberError", () => (
        <DefaultCatchBoundary
          reset={() => {}}
          group={props.error.cause as { id: string; slug: string }}
          error={new Error(props.error.message)}
        />
      )),
      Match.orElse(() => <Fallback />),
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
      Effect.tapError((e) => Console.log(`Validation Error [${e._tag}]: ${e}`)),
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
