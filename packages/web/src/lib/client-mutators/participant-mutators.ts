import { Participant } from "@blank/zero";
import { Prettify } from "@blank/core/lib/utils/index";
import { assertIsAuthenticated, ClientMutator, ClientMutatorGroup } from ".";

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

export const mutators: Mutators = (auth) => ({
  update: async (tx, opts) => {
    assertIsAuthenticated(auth);

    const { expenseId, userId, ...rest } = opts.participant;

    await tx.mutate.participant.update({
      expenseId,
      userId,
      ...rest,
    });
  },
  updateMany: async (tx, opts) => {
    assertIsAuthenticated(auth);

    for (const participant of opts.participants) {
      await mutators(auth).update(tx, { participant });
    }
  },
});
