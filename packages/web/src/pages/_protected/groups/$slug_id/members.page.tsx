import { createFileRoute } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { GroupBody, SecondaryRow, States } from "./layout";
import { useGroupById } from "../../@data/groups";
import { useAuthentication } from "@/lib/authentication";
import { Member } from "@blank/zero";
import { slugify } from "@blank/core/lib/utils/index";
import { ExpenseWithParticipants } from "./page";
import { MembersList } from "./@members/members-list";
import { useRemoveMember } from "../../@data/members";
import { withToast } from "@/lib/toast";

function MembersRoute() {
  const params = Route.useParams({ select: (p) => p.slug_id });
  const authentication = useAuthentication();
  const group = useGroupById(params.id);
  const removeMember = useRemoveMember();

  const members = group.data?.members as Member[];
  const currentMember = members?.find(
    (m) => m.userId === authentication.user.id,
  );

  if (!currentMember) throw new Error("You are not a member of this group");

  if (group.status === "loading") return <States.Loading />;

  if (group.status === "not-found") {
    return <States.NotFound title={slugify(params.slug).decode()} />;
  }

  const handleRemoveMember = async (member: Member) => {
    await withToast({
      promise: () =>
        removeMember({
          groupId: group.data.id,
          memberUserId: member.userId,
        }),
      notify: {
        loading: "Removing member...",
        success: `${member.nickname} has been removed from the group`,
        error: "Failed to remove member",
      },
    });
  };

  return (
    <>
      <SecondaryRow>
        <SubHeading>Manage group members and permissions</SubHeading>
      </SecondaryRow>
      <GroupBody className="space-y-0">
        <ul className="divide-y divide-border">
          <MembersList
            userId={authentication.user.id}
            members={members}
            expenses={group.data.expenses as ExpenseWithParticipants[]}
            group={group.data}
            settle={() => {}}
            remove={handleRemoveMember}
          />
        </ul>
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug_id/members/")({
  component: MembersRoute,
  loader: () => ({ crumb: "Members" }),
});
