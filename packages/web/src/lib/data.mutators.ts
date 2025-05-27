import { schema } from "@blank/zero";
import {
  CustomMutatorDefs,
  Transaction as TransactionInternal,
} from "@rocicorp/zero";
import { slugify } from "./utils";
import { OpenAuthToken } from "@blank/auth/subjects";

const CONSTRAINTS = {
  GROUPS: {
    MAX_USER_CAN_OWN: 4,
    MAX_USER_CAN_BE_MEMBER_OF: 8,
  },
};

export type ClientMutators = ReturnType<typeof createClientMutators>;
export type CreateMutators = CustomMutatorDefs<typeof schema>;
type Transaction = TransactionInternal<typeof schema>;

export type CreateGroupOptions = {
  userId: string;
  username: string;
  title: string;
  description: string;
};

export type DeleteGroupOptions = { groupId: string };
export type DeleteExpenseOptions = { expenseId: string };
export type DeleteAllExpensesOptions = { groupId: string };
export type UpdateExpenseOptions = {
  expenseId: string;
  updates: {
    amount?: number;
    date?: number;
    description?: string;
  };
};

export type UpdateExpenseParticipantsOptions = {
  expenseId: string;
  participants: {
    userId: string;
    split: number;
  }[];
};

const queries = {
  users: (tx: Transaction, userId: string) => {
    return {
      findAllMemberships: () =>
        tx.query.group
          .whereExists("members", (member) => member.where("userId", userId))
          .run(),
    };
  },
  groups: (tx: Transaction, groupId: string) => {
    return {
      findAllMembers: () => tx.query.member.where("groupId", groupId).run(),
      findAllExpenses: () => tx.query.expense.where("groupId", groupId).run(),
      findAllUserPreferences: () =>
        tx.query.preference.where("defaultGroupId", groupId).run(),
    };
  },
  expenses: (tx: Transaction, expenseId: string) => {
    return {
      findAllParticipants: () =>
        tx.query.participant.where("expenseId", expenseId).run(),
      find: () => tx.query.expense.where("id", expenseId).one().run(),
    };
  },
};

const assertUserCanCreateAndJoinGroup = async (
  tx: Transaction,
  userId: string
) => {
  const numGroupsUserOwns = (
    await queries.users(tx, userId).findAllMemberships()
  ).length;

  if (numGroupsUserOwns >= CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN) {
    throw new Error(
      `User can not own more than ${CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN.toString()} groups`
    );
  }

  if (numGroupsUserOwns >= CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN) {
    throw new Error(
      `User can not be a member of more than ${CONSTRAINTS.GROUPS.MAX_USER_CAN_OWN.toString()} groups`
    );
  }
};

const assertExpenseExists = async (tx: Transaction, expenseId: string) => {
  const expense = await queries.expenses(tx, expenseId).find();
  if (!expense) throw new Error("Expense not found");
  return expense;
};

const expenseMutators = {
  async update(tx: Transaction, opts: UpdateExpenseOptions) {
    await assertExpenseExists(tx, opts.expenseId);

    await tx.mutate.expense.update({
      id: opts.expenseId,
      ...opts.updates,
    });
  },
  async updateParticipants(
    tx: Transaction,
    opts: UpdateExpenseParticipantsOptions
  ) {
    await assertExpenseExists(tx, opts.expenseId);

    // Validate splits add up to 1 (100%)
    const totalSplit = opts.participants.reduce((sum, p) => sum + p.split, 0);
    if (Math.abs(totalSplit - 1) > 0.0001) {
      throw new Error("Participant splits must add up to 100%");
    }

    // Get all existing participants (including payer)
    const existingParticipants = await tx.query.participant
      .where("expenseId", opts.expenseId)
      .run();

    // Update each participant's split
    for (const update of opts.participants) {
      const existing = existingParticipants.find(
        (p) => p.userId === update.userId
      );
      if (existing) {
        await tx.mutate.participant.update({
          expenseId: opts.expenseId,
          groupId: existing.groupId,
          userId: update.userId,
          split: update.split,
        });
      }
    }
  },
  async delete(tx: Transaction, opts: DeleteExpenseOptions) {
    const q = queries.expenses(tx, opts.expenseId);

    await tx.mutate.expense.delete({ id: opts.expenseId });

    for (const participant of await q.findAllParticipants()) {
      await tx.mutate.participant.delete({
        groupId: participant.groupId,
        userId: participant.userId,
        expenseId: participant.expenseId,
      });
    }
  },
  async deleteAll(tx: Transaction, opts: DeleteAllExpensesOptions) {
    const q = queries.groups(tx, opts.groupId);
    const expenses = await q.findAllExpenses();

    for (const expense of expenses) {
      await expenseMutators.delete(tx, { expenseId: expense.id });
    }
  },
};

export function createClientMutators(_auth: OpenAuthToken | undefined) {
  return {
    expense: expenseMutators,
    group: {
      async create(tx, opts: CreateGroupOptions) {
        await assertUserCanCreateAndJoinGroup(tx, opts.userId);
        const location = import.meta.env.SSR ? "server" : "client";

        const groupId = crypto.randomUUID();

        await tx.mutate.group.insert({
          id: groupId,
          title: opts.title,
          slug: slugify(opts.title).encode(),
          description: opts.description,
          ownerId: opts.userId,
          createdAt: Date.now(),
        });

        // NOTE: we can call a helper and/or member function here to be re-usable
        await tx.mutate.member.insert({
          groupId,
          userId: opts.userId,
          nickname: opts.username,
        });
      },
      async delete(tx, opts: DeleteGroupOptions) {
        const q = queries.groups(tx, opts.groupId);

        await tx.mutate.group.delete({ id: opts.groupId });

        for (const { groupId, userId } of await q.findAllMembers()) {
          await tx.mutate.member.delete({ groupId, userId });
        }

        for (const { id } of await q.findAllExpenses()) {
          await tx.mutate.expense.delete({ id });
        }
      },
    },
  } as const satisfies CreateMutators;
}
