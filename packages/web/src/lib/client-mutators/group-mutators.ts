import { GroupInsert } from "@blank/core/modules/group/schema";
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

const assertUserCanJoinGroup = async (tx: ZTransaction, userId: string) => {
  const groupsUserBelongsTo = await tx.query.group
    .whereExists("members", (member) => member.where("userId", userId))
    .run();

  if (groupsUserBelongsTo.length >= CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN) {
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

type CreateOptions = Prettify<
  Pick<GroupInsert, "description" | "title"> & {
    id: string;
    userId: string;
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
    assertIsAuthenticated(auth);

    await assertUserCanCreateGroup(tx, opts.userId);
    await assertUserCanJoinGroup(tx, opts.userId);

    const { userId, nickname, ...rest } = opts;

    await tx.mutate.group.insert({
      ownerId: userId,
      createdAt: Date.now(),
      slug: slugify(opts.title).encode(),
      ...rest,
    });

    await tx.mutate.member.insert({
      groupId: opts.id,
      userId,
      nickname,
    });
  },
  update: async (tx, opts) => {
    assertIsAuthenticated(auth);

    await assertGroupExists(tx, opts.groupId);

    await tx.mutate.group.update({
      id: opts.groupId,
      slug: slugify(opts.updates.title).encode(),
      ...opts.updates,
    });
  },
  delete: async (tx, opts) => {
    assertIsAuthenticated(auth);

    await assertGroupExists(tx, opts.groupId);

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
  },
});
