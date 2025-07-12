import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { GroupBody, SecondaryRow } from "./layout";
import { SubHeading } from "@/components/prose";
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { States } from "./layout";
import { useDeleteGroup, useGroupById } from "../../@data/groups";
import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getInvitesByGroupServerFn,
  createGroupInviteServerFn,
  revokeInviteServerFn,
} from "@/server/invite.route";
import { withToast } from "@/lib/toast";
import { Invite } from "@blank/core/modules/invite/schema";
import {
  DEFAULT_INVITE_EXPIRY_UNIT,
  slugify,
} from "@blank/core/lib/utils/index";
import { useAuthentication } from "@/lib/authentication";
import { isTaggedError, TaggedError } from "@blank/core/lib/effect/index";
import { Match } from "effect";
import {
  DefaultCatchBoundary,
  DefaultFallbackError,
} from "@/components/default-catch-boundary";

const PageErrors = {
  DataNotFound: class _ extends TaggedError("DataNotFoundError") {},
  NotAuthorized: class _ extends TaggedError("UserNotAuthorizedError") {},
} as const;

type PageErrors = InstanceType<(typeof PageErrors)[keyof typeof PageErrors]>;

type InviteListProps = {
  invites: Invite[] | undefined;
  copy: (token: string) => void;
  revoke: (token: string) => void;
  isPending: (token: string) => boolean;
};

function InviteList(props: InviteListProps) {
  if (!props.invites || props.invites.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 gap-x-2">
        {props.invites.map((invite) => (
          <div
            key={invite.token}
            className="flex items-center justify-between gap-1 p-2  bg-transparent border"
          >
            <span className="text-sm text-muted-foreground lowercase mr-auto">
              {invite.token.slice(-6)}
            </span>
            <Button
              variant="link"
              size="xs"
              onClick={() => props.copy(invite.token)}
            >
              Copy
            </Button>
            {invite.status === "pending" && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => props.revoke(invite.token)}
                disabled={props.isPending(invite.token)}
              >
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="lowercase text-muted-foreground text-sm pt-1">
        Invites stay active for 1 {DEFAULT_INVITE_EXPIRY_UNIT}
      </p>
    </>
  );
}

function useInviteData(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery(groupInvitesQueryOptions(id));

  const createInvite = useMutation({
    mutationFn: () => createGroupInviteServerFn({ data: { groupId: id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupInvites", id] });
    },
  });

  const revokeInvite = useMutation({
    mutationFn: (token: string) =>
      revokeInviteServerFn({ data: { groupId: id, token } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupInvites", id] });
    },
  });

  const handleCreateInvite = () => {
    withToast({
      promise: createInvite.mutateAsync(),
      notify: {
        loading: "Creating invite...",
        success: "Invite created successfully!",
        error: "Failed to create invite",
      },
    });
  };

  const handleRevokeInvite = (token: string) => {
    withToast({
      promise: revokeInvite.mutateAsync(token),
      classNames: { success: "bg-muted! border-border!" },
      notify: {
        loading: "Revoking invite...",
        success: "Invite revoked successfully!",
        error: "Failed to revoke invite",
      },
    });
  };

  return {
    query: query,
    create: {
      handler: handleCreateInvite,
      mutation: createInvite,
    },
    revoke: {
      handler: handleRevokeInvite,
      mutation: revokeInvite,
    },
  };
}

function useZeroMutations() {
  const deleteGroup = useDeleteGroup();

  return { deleteGroup };
}

function SettingsRoute() {
  const authentication = useAuthentication();
  const params = Route.useParams({ select: (p) => p.slug_id });
  const group = useGroupById(params.id);

  return Match.value(group).pipe(
    Match.when({ status: "loading" }, () => {
      return <States.Loading />;
    }),
    Match.whenOr({ status: "not-found" }, { data: Match.undefined }, () => {
      const group = slugify(params.slug).decode();

      throw new PageErrors.DataNotFound(`Could not load data for ${group}`);
    }),
    Match.not({ data: { ownerId: authentication.user.id } }, () => {
      throw new PageErrors.NotAuthorized(
        "Must be group owner to view settings.",
      );
    }),
    Match.orElse(({ data }) => {
      const router = useRouter();
      const navigate = useNavigate();

      const mutations = useZeroMutations();
      const invites = useInviteData(params.id);

      const confirmDelete = useWithConfirmation({
        description: { type: "default", entity: "group" },
        onConfirm: () => {
          const promise = mutations
            .deleteGroup({ groupId: data.id })
            .then(() => {
              void navigate({ to: "/groups" });
            })
            .catch((error: unknown) =>
              console.error("DELETE_ERROR", JSON.stringify(error, null, 2)),
            );

          return promise;
        },
      });

      const copyInviteLink = (token: string) => {
        const to = router.buildLocation({
          to: "/groups/$slug_id/join/$token",
          params: {
            slug_id: { slug: params.slug, id: params.id },
            token: token,
          },
        });

        navigator.clipboard.writeText(`${window.location.origin}${to.href}`);

        withToast({
          promise: Promise.resolve(),
          classNames: { success: "bg-muted! border-border!" },
          notify: {
            loading: "",
            success: "Invite link copied to clipboard!",
            error: "",
          },
        });
      };

      const activeInvitesTitle = () =>
        !!invites.query.data?.length ? "Active Invites" : "No Active Invites";

      return (
        <>
          <SecondaryRow>
            <SubHeading>Manage group settings</SubHeading>
          </SecondaryRow>
          <GroupBody className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <div className="border rounded-md p-4 flex flex-col gap-3 h-min">
              <div>
                <h3 className="text-lg font-medium mb-1 uppercase">
                  Invite People
                </h3>
                <p className="text-sm text-muted-foreground mb-3 lowercase">
                  Create invite links to add new members to your group.
                </p>
              </div>

              <Button
                onClick={invites.create.handler}
                disabled={invites.create.mutation.isPending}
                variant="theme"
                size="sm"
                className="w-full"
              >
                {invites.create.mutation.isPending
                  ? "Creating..."
                  : "Create Invite Link"}
              </Button>

              <p className="uppercase text-sm font-medium">
                {activeInvitesTitle()}
              </p>
              <InviteList
                copy={copyInviteLink}
                invites={invites.query.data}
                revoke={invites.revoke.handler}
                isPending={(token: string) =>
                  invites.revoke.mutation.variables == token &&
                  (invites.revoke.mutation.isPending ||
                    invites.query.isRefetching)
                }
              />
            </div>

            <div className="border rounded-md p-4 flex flex-col gap-3 h-min">
              <div>
                <h3 className="text-lg font-medium mb-1 uppercase">
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-3 lowercase">
                  Destructive actions that cannot be undone.
                </p>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete.confirm}
              >
                Delete Group
              </Button>
            </div>
          </GroupBody>
          <confirmDelete.dialog />
        </>
      );
    }),
  );
}

function groupInvitesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["groupInvites", id],
    queryFn: async () => {
      return getInvitesByGroupServerFn({ data: { groupId: id } });
    },
  });
}

export const Route = createFileRoute("/_protected/groups/$slug_id/settings/")({
  errorComponent: (props) => {
    if (!isTaggedError<PageErrors>(props.error)) {
      console.log("1");
      return <DefaultFallbackError />;
    }

    return Match.value(props.error).pipe(
      Match.whenOr(
        { _tag: "DataNotFoundError" },
        { _tag: "UserNotAuthorizedError" },
        (error) => {
          console.log("2");
          return (
            <DefaultCatchBoundary
              reset={() => {}}
              error={new Error(error.message)}
            />
          );
        },
      ),
      Match.orElse(() => {
        console.log("3");
        return <DefaultFallbackError />;
      }),
    );
  },
  component: SettingsRoute,
  loader: async (opts) => {
    try {
      await opts.context.queryClient.ensureQueryData(
        groupInvitesQueryOptions(opts.params.slug_id.id),
      );
    } catch (e) {
      console.error(e);
    }

    return { crumb: "Settings" };
  },
});
