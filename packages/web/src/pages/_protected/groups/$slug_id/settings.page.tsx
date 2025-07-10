import {
  createFileRoute,
  getRouteApi,
  useLinkProps,
  useLocation,
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
import { Label } from "@/components/ui/label";
import { withToast } from "@/lib/toast";
import { Invite } from "@blank/core/modules/invite/schema";

type InviteListProps = {
  invites: Invite[] | undefined;
  copy: (token: string) => void;
  revoke: (token: string) => void;
  isPending: (token: string) => boolean;
};

function InviteList(props: InviteListProps) {
  if (!props.invites || props.invites.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 gap-x-2">
      {props.invites.map((invite) => (
        <div
          key={invite.token}
          className="flex items-center justify-between gap-1 p-2  bg-transparent border"
        >
          <span className="text-sm text-muted-foreground lowercase mr-auto">
            {invite.token.slice(-5)}
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
  );
}

function useInviteData(id: string, slug: string) {
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
  const router = useRouter();
  const navigate = useNavigate();
  const params = Route.useParams()["slug_id"];

  const { data, status } = useGroupById(params.id);

  const mutations = useZeroMutations();
  const invites = useInviteData(params.id, params.slug);

  if (status === "not-found") return <States.NotFound title={params.slug} />;
  if (!data) return <States.Loading />;

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
      params: { slug_id: `${params.slug}_${params.id}`, token: token },
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

          <Label className="text-sm uppercase lg:col-span-2 py-1">
            {activeInvitesTitle()}
          </Label>
          <InviteList
            copy={copyInviteLink}
            invites={invites.query.data}
            revoke={invites.revoke.handler}
            isPending={(token: string) =>
              invites.revoke.mutation.isPending &&
              invites.revoke.mutation.variables == token
            }
          />
        </div>

        <div className="border rounded-md p-4 flex flex-col gap-3 h-min">
          <div>
            <h3 className="text-lg font-medium mb-1 uppercase">Danger Zone</h3>
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
  component: SettingsRoute,
  loader: (opts) => {
    void opts.context.queryClient.ensureQueryData(
      groupInvitesQueryOptions(opts.params.slug_id.id),
    );

    return { crumb: "Settings" };
  },
});
