import {
  assertIsAuthenticated,
  ClientMutator,
  ClientMutatorGroup,
  ZTransaction,
} from ".";
import { mutators as participantMutators } from "./participant-mutators";
import { ExpenseWithParticipants } from "@/pages/_protected/groups/$slug_id/page";
import { checkExpenseSplitValidity } from "../monetary/balances";
import { Option, Schema as S } from "effect";

export type DeleteOptions = typeof DeleteOptions.Type;
export type DeleteAllOptions = typeof DeleteAllOptions.Type;
export type BulkSettleOptions = typeof BulkSettleOptions.Type;
export type UpdateOptions = typeof UpdateOptions.Type;

const DeleteOptions = S.Struct({ expenseId: S.String });

const DeleteAllOptions = S.Struct({ groupId: S.String });

const BulkSettleOptions = S.Struct({
  groupId: S.String,
  expenseIds: S.String.pipe(S.Array),
});

const UpdateOptions = S.Struct({
  expenseId: S.UUID,
  updates: S.Struct({
    expense: S.Struct({
      amount: S.Int.pipe(S.optionalWith({ exact: true })),
      date: S.Number.pipe(S.optionalWith({ exact: true })),
      description: S.String.pipe(S.optionalWith({ exact: true })),
      status: S.Literal("active", "settled").pipe(
        S.optionalWith({ exact: true }),
      ),
    }).pipe(S.optionalWith({ exact: true })),
    participants: S.Struct({
      userId: S.String,
      role: S.Literal("payer", "participant").pipe(
        S.optionalWith({ exact: true }),
      ),
      split: S.Tuple(S.Number, S.Number).pipe(S.optionalWith({ exact: true })),
    })
      .pipe(S.Array)
      .pipe(S.optionalWith({ exact: true })),
  }),
});

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
  update: async (tx, $opts) => {
    assertIsAuthenticated(auth);

    const opts = S.validateOption(UpdateOptions)($opts).pipe(Option.getOrThrow);

    const expense = await assertExpenseExists(tx, opts.expenseId);

    if (opts.updates.expense?.status) {
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
      split: participant.split as [number, number], // mutators expects non-readonly
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
