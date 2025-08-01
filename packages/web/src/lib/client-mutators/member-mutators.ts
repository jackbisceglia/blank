import { Group } from "@blank/zero";
import {
  assertIsAuthenticated,
  ClientMutator,
  ClientMutatorGroup,
  ZTransaction,
} from ".";

const getGroup = (tx: ZTransaction, groupId: string) =>
  tx.query.group.where("id", groupId).one().run();

function assertGroupExists(group: Group | undefined): asserts group is Group {
  if (!group) throw new Error("Group not found");
}

async function assertMemberExists(
  tx: ZTransaction,
  groupId: string,
  userId: string,
  flip: boolean = false, // invert the assertion logic
) {
  const member = await tx.query.member
    .where("groupId", groupId)
    .where("userId", userId)
    .one()
    .run();

  const condition = !flip === !member;
  const message = !flip ? "Member not found" : "Member already exists";

  if (condition) throw new Error(message);
}

async function assertUserIsGroupOwner(group: Group, userId: string) {
  if (group.ownerId !== userId) {
    throw new Error("Only group owners can manage members");
  }
}

export type RemoveMemberOptions = {
  groupId: string;
  memberUserId: string;
};

export type UpdateMemberNicknameOptions = {
  groupId: string;
  nickname: string;
};

type Mutators = ClientMutatorGroup<{
  remove: ClientMutator<RemoveMemberOptions, void>;
  updateNickname: ClientMutator<UpdateMemberNicknameOptions, void>;
}>;

export const mutators: Mutators = (auth) => ({
  remove: async (tx, opts) => {
    const authenticatedUser = assertIsAuthenticated(auth);
    const userId = authenticatedUser.userID;

    const group = await getGroup(tx, opts.groupId);

    assertGroupExists(group);
    assertUserIsGroupOwner(group, userId);

    await assertMemberExists(tx, opts.groupId, opts.memberUserId);

    if (group.ownerId === opts.memberUserId) {
      throw new Error("Cannot remove the group owner");
    }

    const participants = await tx.query.participant
      .where("groupId", opts.groupId)
      .where("userId", opts.memberUserId)
      .run();

    for (const participant of participants) {
      await tx.mutate.participant.delete({
        expenseId: participant.expenseId,
        userId: participant.userId,
      });
    }

    await tx.mutate.member.delete({
      groupId: opts.groupId,
      userId: opts.memberUserId,
    });
  },

  updateNickname: async (tx, opts) => {
    const authenticatedUser = assertIsAuthenticated(auth);
    const userId = authenticatedUser.userID;

    await assertMemberExists(tx, opts.groupId, authenticatedUser.userID);

    await tx.mutate.member.update({
      groupId: opts.groupId,
      userId: userId,
      nickname: opts.nickname,
    });
  },
});
