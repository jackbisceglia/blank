import { Button } from "@/components/ui/button";
import { Invite } from "@blank/core/modules/invite/schema";
import { withToast } from "@/lib/toast";
import { queryOptions, useQuery, useMutation } from "@tanstack/react-query";
import {
  getInvitesByGroupServerFn,
  createGroupInviteServerFn,
  revokeInviteServerFn,
} from "@/server/invite.route";
import { useRouter } from "@tanstack/react-router";
import { ACTIVE_INVITE_CAPACITY } from "@blank/core/lib/utils/constants";
import { key, useInvalidate } from "@/lib/query";

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 gap-x-2 mb-auto items-start">
        {props.invites.map((invite) => (
          <div
            key={invite.token}
            className="flex items-center justify-between gap-1 py-1.5 px-2 bg-transparent border h-min"
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
    </>
  );
}

export function invitesQueryOptions(groupId: string) {
  return queryOptions({
    queryKey: key("invites", groupId),
    queryFn: () => getInvitesByGroupServerFn({ data: { groupId } }),
  });
}

function useInviteData(groupId: string, groupSlug: string) {
  const router = useRouter();
  const invalidate = useInvalidate();

  const query = useQuery(invitesQueryOptions(groupId));

  const createInvite = useMutation({
    mutationFn: () => createGroupInviteServerFn({ data: { groupId } }),
    onSuccess: () => invalidate((tuple) => tuple("invites", groupId)),
  });

  const revokeInvite = useMutation({
    mutationFn: (token: string) =>
      revokeInviteServerFn({ data: { groupId, token } }),
    onSuccess: () => invalidate((tuple) => tuple("invites", groupId)),
  });

  const handleCreateInvite = async () => {
    return await withToast({
      promise: createInvite.mutateAsync(),
      notify: {
        loading: "Creating invite...",
        success: "Invite created successfully!",
        error: "Failed to create invite",
      },
    });
  };

  const handleRevokeInvite = async (token: string) => {
    return await withToast({
      promise: revokeInvite.mutateAsync(token),
      classNames: { success: "bg-muted! border-border!" },
      notify: {
        loading: "Revoking invite...",
        success: "Invite revoked successfully!",
        error: "Failed to revoke invite",
      },
    });
  };

  const copyInviteLink = (token: string) => {
    const to = router.buildLocation({
      to: "/groups/$slug_id/join/$token",
      params: {
        slug_id: { slug: groupSlug, id: groupId },
        token: token,
      },
    });

    withToast({
      promise: Promise.resolve(() =>
        navigator.clipboard.writeText(`${window.location.origin}${to.href}`),
      ),
      classNames: { success: "bg-muted! border-border!" },
      notify: {
        loading: "",
        success: "Invite link copied to clipboard!",
        error: "",
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
    copyInviteLink,
  };
}

type InviteSettingsCardProps = {
  groupId: string;
  groupSlug: string;
};

export function InviteSettingsCard({
  groupId,
  groupSlug,
}: InviteSettingsCardProps) {
  const invites = useInviteData(groupId, groupSlug);

  const activeInvitesTitle = () =>
    invites.query.status === "pending"
      ? "..."
      : !!invites.query.data?.length
        ? "Active Invites"
        : "No Active Invites";

  const hasActiveInviteCapacity = () =>
    invites.query.data && invites.query.data.length < ACTIVE_INVITE_CAPACITY;

  return (
    <div className="border rounded-md p-4 flex flex-col gap-2 h-full">
      <div>
        <h3 className="text-lg font-medium mb-1 uppercase">Invite People</h3>
        <p className="text-sm text-muted-foreground mb-2 lowercase">
          Create links to add new members— active for 1 hour.
        </p>
      </div>

      {invites.query.status === "success" && (
        <>
          <p className="uppercase text-sm font-medium">
            {activeInvitesTitle()}
          </p>
          <InviteList
            copy={invites.copyInviteLink}
            invites={invites.query.data}
            revoke={invites.revoke.handler}
            isPending={(token: string) =>
              invites.revoke.mutation.variables == token &&
              (invites.revoke.mutation.isPending || invites.query.isRefetching)
            }
          />
        </>
      )}

      <div className="mb-0 mt-auto">
        <Button
          onClick={invites.create.handler}
          disabled={
            invites.create.mutation.isPending || !hasActiveInviteCapacity()
          }
          variant="theme"
          size="xs"
          className="py-2 w-full h-auto mt-auto"
        >
          {invites.create.mutation.isPending
            ? "Creating..."
            : "Create Invite Link"}
        </Button>
      </div>
    </div>
  );
}
