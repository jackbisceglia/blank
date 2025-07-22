import { createFileRoute } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { GroupBody, States } from "./layout";
import { useGroupById } from "../../@data/groups";
import { useAuthentication } from "@/lib/authentication";
import { createBalanceMap } from "@/lib/balances";
import { Member } from "@blank/zero";
import { slugify } from "@blank/core/lib/utils/index";

import { MemberList } from "./@members/member-list";
import {
  EmptyMembersState,
  LoadingMembersState,
} from "./@members/member-states";
import { useRemoveMember } from "../../@data/members";
import { ExpenseWithParticipants } from "./page";
import { withToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

function MembersRoute() {
  const params = Route.useParams({ select: (p) => p.slug_id });
  const authentication = useAuthentication();
  const group = useGroupById(params.id);
  const removeMember = useRemoveMember();

  if (group.status === "not-found") {
    return <States.NotFound title={slugify(params.slug).decode()} />;
  }

  if (group.status === "loading") {
    return (
      <>
        <SubHeading>Manage group members and permissions</SubHeading>
        <GroupBody>
          <div className="grid grid-rows-1 grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-card border rounded-xl h-32"
              />
            ))}
          </div>
          <LoadingMembersState />
        </GroupBody>
      </>
    );
  }

  const members = group.data?.members as Member[];
  const balances = createBalanceMap(
    group.data?.expenses as ExpenseWithParticipants[],
  );
  const isOwner = authentication.user.id === group.data?.ownerId;

  const handleRemoveMember = async (member: Member) => {
    await withToast({
      promise: () =>
        removeMember({
          groupId: params.id,
          userId: member.userId,
        }),
      notify: {
        loading: "Removing member...",
        success: `${member.nickname} has been removed from the group`,
        error: "Failed to remove member",
      },
    });
  };

  const handleInviteMember = () => {
    // TODO: Implement invite dialog
    void withToast({
      promise: () => Promise.resolve(),
      notify: {
        loading: "",
        success: "Member invitation feature coming soon",
        error: "Error",
      },
    });
  };

  if (!members || members.length === 0) {
    return (
      <>
        <SubHeading>Manage group members and permissions</SubHeading>
        <GroupBody>
          <EmptyMembersState
            canInvite={isOwner}
            onInvite={handleInviteMember}
          />
        </GroupBody>
      </>
    );
  }

  return (
    <>
      <SubHeading>Manage group members and permissions</SubHeading>
      <GroupBody>
        <MemberList
          members={members}
          balances={balances}
          currentUserId={authentication.user.id}
          groupOwnerId={group.data?.ownerId || ""}
          onRemoveMember={handleRemoveMember}
        />
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug_id/members/")({
  component: MembersRoute,
  loader: () => ({ crumb: "Members" }),
});
