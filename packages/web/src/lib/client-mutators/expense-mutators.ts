import { Expense } from "@blank/zero";
import {
  assertIsAuthenticated,
  ClientMutator,
  ClientMutatorGroup,
  ZTransaction,
} from ".";
import { mutators as participantMutators } from "./participant-mutators";
import { UpdateParticipant } from "./participant-mutators";
import { ExpenseWithParticipants } from "@/pages/_protected/groups/$slug_id/page";
import { checkExpenseSplitValidity } from "../balances";

export type DeleteOptions = { expenseId: string };
export type DeleteAllOptions = { groupId: string };
export type BulkSettleOptions = { groupId: string; expenseIds: string[] };
export type UpdateOptions = {
  expenseId: string;
  updates: {
    expense: {
      amount?: Expense["amount"];
      date?: Expense["date"];
      description?: Expense["description"];
      status?: Expense["status"];
    };
    participants?: Omit<UpdateParticipant, "expenseId">[];
  };
};

const assertExpenseExists = async (tx: ZTransaction, expenseId: string) => {
  const expense = await tx.query.expense
    .where("id", expenseId)
    .related("participants", (p) => p.related("member").related("member"))
    .one()
    .run();

  if (!expense) throw new Error("Expense not found");

  return expense;
};

const assertExpenseHasValidSplit = (expense: ExpenseWithParticipants) => {
  if (!checkExpenseSplitValidity(expense.participants)) {
    throw Error(`These splits do not sum to 100%`);
  }
};

type Mutators = ClientMutatorGroup<{
  update: ClientMutator<UpdateOptions, void>;
  delete: ClientMutator<DeleteOptions, void>;
  deleteByGroupId: ClientMutator<DeleteAllOptions, void>;
  bulkSettle: ClientMutator<BulkSettleOptions, void>;
}>;

export const mutators: Mutators = (auth) => ({
  update: async (tx, opts) => {
    assertIsAuthenticated(auth);

    const expense = await assertExpenseExists(tx, opts.expenseId);

    if (opts.updates.expense.status) {
      assertExpenseHasValidSplit(expense as ExpenseWithParticipants);
    }

    await tx.mutate.expense.update({
      id: opts.expenseId,
      ...opts.updates.expense,
    });

    if (!opts.updates.participants) return;

    const participants = opts.updates.participants.map((participant) => ({
      ...participant,
      expenseId: opts.expenseId,
    }));

    await participantMutators(auth).updateMany(tx, { participants });

    return;
  },
  delete: async (tx, opts) => {
    assertIsAuthenticated(auth);

    await assertExpenseExists(tx, opts.expenseId);

    await tx.mutate.expense.delete({ id: opts.expenseId });

    const participants = await tx.query.participant
      .where("expenseId", opts.expenseId)
      .run();

    for (const participant of participants) {
      await tx.mutate.participant.delete({
        userId: participant.userId,
        expenseId: participant.expenseId,
      });
    }
  },
  deleteByGroupId: async (tx, opts) => {
    assertIsAuthenticated(auth);

    const expenses = await tx.query.expense
      .where("groupId", opts.groupId)
      .run();

    for (const expense of expenses) {
      await mutators(auth).delete(tx, { expenseId: expense.id });
    }
  },
  bulkSettle: async (tx, opts) => {
    assertIsAuthenticated(auth);

    const expenses = await tx.query.expense
      .where("groupId", opts.groupId)
      .related("participants", (p) => p.related("member").related("member"))
      .where("status", "active")
      .run();

    const expensesToSettle = expenses.filter((expense) =>
      opts.expenseIds.includes(expense.id),
    );

    expensesToSettle.forEach((expense) =>
      assertExpenseHasValidSplit(expense as ExpenseWithParticipants),
    );

    for (const expense of expensesToSettle) {
      await tx.mutate.expense.update({
        id: expense.id,
        status: "settled",
      });
    }
  },
});
