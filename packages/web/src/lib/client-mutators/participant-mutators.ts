import { Expense, Participant } from "@blank/zero";
import { Prettify } from "@blank/core/lib/utils/index";
import {
  assertIsAuthenticated,
  assertUserIsGroupMember,
  ClientMutator,
  ClientMutatorGroup,
} from ".";

export type UpdateParticipant = Prettify<
  Required<Pick<Participant, "userId" | "expenseId">> &
    Partial<Omit<Participant, "groupId">>
>;

export type UpdateOptions = {
  participant: UpdateParticipant;
};

export type UpdateManyOptions = {
  participants: UpdateParticipant[];
};

type Mutators = ClientMutatorGroup<{
  update: ClientMutator<UpdateOptions, void>;
  updateMany: ClientMutator<UpdateManyOptions, void>;
}>;

function assertExpenseExists(
  expense: Expense | undefined,
): asserts expense is Expense {
  if (!expense) throw new Error("Expense not found");
}

export const mutators: Mutators = (auth) => ({
  update: async (tx, opts) => {
    const authed = assertIsAuthenticated(auth);

    const expense = await tx.query.expense
      .where("id", opts.participant.expenseId)
      .one()
      .run();

    assertExpenseExists(expense);

    await assertUserIsGroupMember(tx, expense.groupId, authed.userID);

    const { expenseId, userId, role, split } = opts.participant;

    await tx.mutate.participant.update({
      expenseId,
      userId,
      ...(role !== undefined ? { role } : {}),
      ...(split !== undefined ? { split } : {}),
    });
  },
  updateMany: async (tx, opts) => {
    assertIsAuthenticated(auth);

    for (const participant of opts.participants) {
      await mutators(auth).update(tx, { participant });
    }
  },
});
