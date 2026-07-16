import { GroupInsert } from "@blank/core/modules/group/schema";
import { Group } from "@blank/zero";
import {
  assertIsAuthenticated,
  ClientMutator,
  ClientMutatorGroup,
  ZTransaction,
} from ".";
import { Prettify, slugify } from "@blank/core/lib/utils/index";

// TODO: make custom server mutator logic to bump these limits based on user's plan
const CONSTRAINTS = {
  GROUPS: {
    MAX_USER_CAN_OWN: 4,
    MAX_USER_CAN_BE_MEMBER_OF: 8,
  },
};

const assertUserCanCreateGroup = async (tx: ZTransaction, userId: string) => {
  const groupsUserOwns = await tx.query.group.where("ownerId", userId).run();

  if (groupsUserOwns.length >= CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN) {
    throw new Error(
      `User can not own more than ${CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN.toString()} groups`,
    );
  }
};

const assertUserCanJoinGroup = async (count: number) => {
  if (count >= CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN) {
    throw new Error(
      `User can not be a member of more than ${CONSTRAINTS.GROUPS.MAX_USER_CAN_BE_MEMBER_OF.toString()} groups`,
    );
  }
};

const assertGroupExists = async (tx: ZTransaction, groupId: string) => {
  const group = await tx.query.group.where("id", groupId).one().run();

  if (!group) throw new Error("Group not found");

  return group;
};

const assertUserOwnsGroup = (group: Group, userId: string) => {
  if (group.ownerId !== userId) {
    throw new Error("Only the group owner can perform this action");
  }
};

type CreateOptions = Prettify<
  Pick<GroupInsert, "description" | "title"> & {
    id: string;
    nickname: string;
  }
>;
export type DeleteGroupOptions = { groupId: string };
export type UpdateGroupOptions = {
  groupId: string;
  updates: { title: string; description: string };
};

type Mutators = ClientMutatorGroup<{
  create: ClientMutator<CreateOptions, void>;
  delete: ClientMutator<DeleteGroupOptions, void>;
  update: ClientMutator<UpdateGroupOptions, void>;
}>;

export const mutators: Mutators = (auth) => ({
  create: async (tx, opts) => {
    const authed = assertIsAuthenticated(auth);

    const groupsUserBelongsTo = await tx.query.group
      .whereExists("members", (member) => member.where("userId", authed.userID))
      .run();

    await assertUserCanCreateGroup(tx, authed.userID);
    await assertUserCanJoinGroup(groupsUserBelongsTo.length);

    await tx.mutate.group.insert({
      id: opts.id,
      ownerId: authed.userID,
      createdAt: Date.now(),
      slug: slugify(opts.title).encode(),
      title: opts.title,
      description: opts.description,
    });

    await tx.mutate.member.insert({
      groupId: opts.id,
      userId: authed.userID,
      nickname: opts.nickname,
    });

    if (groupsUserBelongsTo.length === 0) {
      await tx.mutate.preference.upsert({
        userId: authed.userID,
        defaultGroupId: opts.id,
      });
    }
  },
  update: async (tx, opts) => {
    const authed = assertIsAuthenticated(auth);

    const group = await assertGroupExists(tx, opts.groupId);
    assertUserOwnsGroup(group, authed.userID);

    await tx.mutate.group.update({
      id: opts.groupId,
      slug: slugify(opts.updates.title).encode(),
      title: opts.updates.title,
      description: opts.updates.description,
    });
  },
  delete: async (tx, opts) => {
    const authed = assertIsAuthenticated(auth);

    const group = await assertGroupExists(tx, opts.groupId);
    assertUserOwnsGroup(group, authed.userID);

    await tx.mutate.group.delete({ id: opts.groupId });

    const members = tx.query.member.where("groupId", opts.groupId).run();

    for (const member of await members) {
      await tx.mutate.member.delete({
        groupId: opts.groupId,
        userId: member.userId,
      });
    }

    const expenses = tx.query.expense.where("groupId", opts.groupId).run();

    for (const expense of await expenses) {
      await tx.mutate.expense.delete({ id: expense.id });
    }

    const preference = await tx.query.preference
      .where("userId", authed.userID)
      .one()
      .run();

    if (preference?.defaultGroupId === opts.groupId) {
      await tx.mutate.preference.delete({
        defaultGroupId: opts.groupId,
        userId: authed.userID,
      });
    }
  },
});
