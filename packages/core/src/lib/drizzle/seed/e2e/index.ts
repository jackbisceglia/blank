import { Effect, Console } from "effect";
import { createUsers } from "./users";
import { createGroups } from "./groups";
import { expenses, groups, participants, users } from "../../../../modules";
import { members } from "../../../../modules/member/entity";
import { createExpenses } from "./expenses";
import { preferences } from "../../../../modules/preference/entity";

const clean = Effect.fn("clean")(function* () {
  for (const namespace of [
    expenses,
    groups,
    members,
    participants,
    users,
    preferences,
  ]) {
    yield* namespace.removeAll();
  }
});

const seed = Effect.fn("seed")(function* () {
  yield* clean();

  const [me, ...rest] = yield* createUsers();
  yield* Console.info("\n\ncreated users: ", JSON.stringify([me, ...rest]));

  const groups = yield* createGroups(me, rest);
  yield* Console.info("\n\ncreated groups: ", JSON.stringify(groups));

  const expenses = yield* createExpenses(groups);
  yield* Console.info("\n\ncreated expenses: ", JSON.stringify(expenses));
});

void (() => {
  Effect.runPromise(seed());
})();
