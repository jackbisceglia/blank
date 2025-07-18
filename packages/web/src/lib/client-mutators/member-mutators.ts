import {
  assertIsAuthenticated,
  ClientMutator,
  ClientMutatorGroup,
  ZTransaction,
} from ".";

const assertGroupExists = async (tx: ZTransaction, groupId: string) => {
  const group = await tx.query.group.where("id", groupId).one().run();
  if (!group) throw new Error("Group not found");
  return group;
};

const assertMemberExists = async (tx: ZTransaction, groupId: string, userId: string) => {
  const member = await tx.query.member
    .where("groupId", groupId)
    .where("userId", userId)
    .one()
    .run();
  if (!member) throw new Error("Member not found");
  return member;
};

const assertIsGroupOwner = async (tx: ZTransaction, groupId: string, userId: string) => {
  const group = await assertGroupExists(tx, groupId);
  if (group.ownerId !== userId) {
    throw new Error("Only group owners can manage members");
  }
  return group;
};

export type RemoveMemberOptions = {
  groupId: string;
  userId: string;
};

export type InviteMemberOptions = {
  groupId: string;
  userId: string;
  nickname: string;
};

type Mutators = ClientMutatorGroup<{
  remove: ClientMutator<RemoveMemberOptions, void>;
  invite: ClientMutator<InviteMemberOptions, void>;
}>;

export const mutators: Mutators = (auth) => ({
  remove: async (tx, opts) => {
    const authenticatedUser = assertIsAuthenticated(auth);
    
    await assertIsGroupOwner(tx, opts.groupId, authenticatedUser.sub);
    await assertMemberExists(tx, opts.groupId, opts.userId);
    
    // Don't allow removing the group owner
    const group = await assertGroupExists(tx, opts.groupId);
    if (group.ownerId === opts.userId) {
      throw new Error("Cannot remove the group owner");
    }

    // Remove all participants for this member first
    const participants = await tx.query.participant
      .where("groupId", opts.groupId)
      .where("userId", opts.userId)
      .run();

    for (const participant of participants) {
      await tx.mutate.participant.delete({
        expenseId: participant.expenseId,
        userId: participant.userId,
      });
    }

    // Remove the member
    await tx.mutate.member.delete({
      groupId: opts.groupId,
      userId: opts.userId,
    });
  },
  
  invite: async (tx, opts) => {
    const authenticatedUser = assertIsAuthenticated(auth);
    
    await assertIsGroupOwner(tx, opts.groupId, authenticatedUser.sub);
    
    // Check if member already exists
    const existingMember = await tx.query.member
      .where("groupId", opts.groupId)
      .where("userId", opts.userId)
      .one()
      .run();
      
    if (existingMember) {
      throw new Error("User is already a member of this group");
    }

    await tx.mutate.member.insert({
      groupId: opts.groupId,
      userId: opts.userId,
      nickname: opts.nickname,
    });
  },
});