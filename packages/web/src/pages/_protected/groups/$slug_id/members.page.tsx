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
import { useWithConfirmationImperative } from "@/components/with-confirmation-dialog";

function useRemoveMemberWithConfirmation(groupId: string) {
  const remove = useRemoveMember();
  const action = useWithConfirmationImperative({
    title: "Remove Member?",
    description: { type: "default", entity: "member" },
  });

  async function confirm(member: Member) {
    if (!(await action.confirm())) return;

    const promise = remove({
      groupId: groupId,
      memberUserId: member.userId,
    });

    return withToast({
      promise,
      notify: {
        loading: "Removing member...",
        success: `${member.nickname} has been removed from the group`,
        error: "Failed to remove member",
      },
    });
  }

  return { confirm, dialog: action.dialog };
}

function MembersRoute() {
  const params = Route.useParams({ select: (p) => p.slug_id });
  const authentication = useAuthentication();
  const group = useGroupById(params.id);

  const isLoading = group.status === "loading";

  if (isLoading) return <States.Loading loading={isLoading} />;

  if (group.status === "not-found") {
    return <States.NotFound title={slugify(params.slug).decode()} />;
  }

  const removeMember = useRemoveMemberWithConfirmation(group.data.id);

  const members = group.data?.members as Member[];
  const currentMember = members?.find(
    (m) => m.userId === authentication.user.id,
  );

  if (!currentMember) throw new Error("You are not a member of this group");

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
            // TODO: implement
            settle={() => {}}
            remove={removeMember.confirm}
          />
        </ul>
      </GroupBody>
      <removeMember.dialog />
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug_id/members/")({
  component: MembersRoute,
  loader: () => ({ crumb: "Members" }),
});
