import { Effect, Array, Number, Random, pipe } from "effect";
import { expenses, participants } from "../../../../modules";
import { ParticipantInsert } from "../../schema";
import _ from "./mock.json";

type Group = {
  group: { id: string };
  members: { groupId: string; userId: string }[];
};

type MockExpenseDescription = string;
type MockExpenseParticipantCount = number;
type Entry = [MockExpenseDescription, MockExpenseParticipantCount];

const data = _.expenses as Entry[];

const DROP_WEIGHT = 4;

export const createExpenses = Effect.fn("createExpenses")(function* (
  groups: Group[],
) {
  const createSingle = Effect.fn("createExpense")(function* (
    group: Group,
    entry: Entry,
  ) {
    const [description, count] = entry;

    const expenseToInsert = {
      description: description,
      amount: yield* Random.nextIntBetween(5, 500),
      groupId: group.group.id,
    };

    const expenseCreated = yield* expenses.create(expenseToInsert);

    const numParticipants = Number.min(count, group.members.length);
    const participantsToInsert = yield* pipe(
      Random.shuffle(group.members),
      Effect.map(Array.take(numParticipants)),
      Effect.map(
        Array.map(
          (member, index) =>
            ({
              expenseId: expenseCreated.id,
              groupId: group.group.id,
              split: [1, numParticipants],
              userId: member.userId,
              role: index === 0 ? "payer" : "participant",
            }) satisfies ParticipantInsert,
        ),
      ),
    );

    const participantsCreated =
      yield* participants.createMany(participantsToInsert);

    return { expense: expenseCreated, participant: participantsCreated };
  });

  const shuffled = yield* Random.shuffle(data);
  const segments = Array.split(shuffled, groups.length);

  // slightly humanize expenses such that each group doesn't have the exact same number of expenses
  const humanized = yield* Effect.forEach(
    segments,
    Effect.fn("humanized")(function* (segment, index) {
      const toDrop = yield* Random.nextIntBetween(0, (index + 1) * DROP_WEIGHT);

      return Array.drop(segment, Math.min(toDrop, segment.length));
    }),
  );

  const combinations = Array.zip(groups, humanized);

  const result = yield* Effect.forEach(
    combinations,
    Effect.fn("eachGroup")(function* (combination) {
      const [group, mockExpenses] = combination;
      return yield* Effect.forEach(
        mockExpenses,
        Effect.fn("eachExpense")(function* (expense) {
          return yield* createSingle(group, expense);
        }),
      );
    }),
  );

  return Array.flatten(result);
});
