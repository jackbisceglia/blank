import { db, groups, Member, ParticipantInsert, participants } from ".";
import { nl } from "../ai";
import { requireSingleElement, unwrapOrThrow } from "../utils";
import { ExpenseInsert, expenseTable } from "./expense.schema";
import { DatabaseWriteError, Transaction } from "./utils";
import { TaggedError } from "../utils";
import { Effect, Match, pipe } from "effect";
import {
  findClosestMatch,
  MIN_MATCH_THRESHOLD,
} from "../utils/string-similarity";

const USER = "USER";

class ExpenseNotCreatedError extends TaggedError("ExpenseNotCreatedError") {}
class DuplicateExpenseError extends TaggedError("DuplicateExpenseError") {}
class ExpenseParsingError extends TaggedError("ExpenseParsingError") {}
class UserMissingInParse extends TaggedError("UserMissingInParse") {}
class NoMemberMatchFound extends TaggedError("NoMemberMatchFound") {}

type Participant = Required<Omit<ParticipantInsert, "expenseId" | "groupId">>;
type ParticipantParse = { role: string; split: number; name: string };

function createMapping(member: ParticipantParse, userId: string) {
  type Roles = "participant" | "payer";

  return {
    role: member.role as Roles,
    split: member.split.toString(),
    userId: userId,
  } satisfies Participant;
}

function findClosestName(name: string, names: string[]) {
  const [bestMatch, score] = findClosestMatch(name, names);

  return Effect.if(score > MIN_MATCH_THRESHOLD, {
    onTrue: () => Effect.succeed(bestMatch),
    onFalse: () =>
      Effect.fail(
        new NoMemberMatchFound("Member from parse not found in group")
      ),
  });
}

function normalize(parsedMembers: ParticipantParse[], groupMembers: Member[]) {
  const normalizeMember = (member: ParticipantParse) =>
    Effect.gen(function* () {
      const names = groupMembers.map((m) => m.nickname);

      const closestName = yield* findClosestName(member.name, names);

      const userId = groupMembers.find((m) => m.nickname === closestName)
        ?.userId as string;

      return createMapping(member, userId);
    });

  return Effect.forEach(parsedMembers, normalizeMember);
}

export namespace expenses {
  export function create(expense: ExpenseInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(expenseTable)
          .values(expense)
          .returning({ id: expenseTable.id })
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new ExpenseNotCreatedError("Expense not created"),
          dup: () => new DuplicateExpenseError("Duplicate expense found"),
        })
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating expense", e)
      )
    );
  }

  type CreateFromDescriptionOptions = {
    groupId: string;
    userId: string;
    description: string;
    date?: Date;
  };

  export function createFromDescription(options: CreateFromDescriptionOptions) {
    const create = Effect.gen(function* () {
      const members = yield* groups.getMembers(options.groupId);

      const generated = yield* Effect.tryPromise({
        try: () => unwrapOrThrow(nl.expense.parse(options.description)), // TODO: remove after migrate
        catch: (e) => new ExpenseParsingError("Failed parsing expense", e),
      });

      const user = generated.members.find((m) => m.name === USER);

      if (!user) {
        return yield* Effect.fail(
          new UserMissingInParse("User omitted from parse")
        );
      }

      const userMapped = createMapping(user, options.userId);

      const restMapped = yield* normalize(
        generated.members.filter((m) => m.name !== USER),
        members
      );

      const merged = [userMapped, ...restMapped];

      const newExpense = yield* expenses.create({
        amount: generated.expense.amount,
        description: generated.expense.description,
        groupId: options.groupId,
        date: options.date,
      });

      const newParticipants = yield* participants.createMany(
        merged.map((m) => ({
          groupId: options.groupId,
          expenseId: newExpense.id,
          ...m,
        }))
      );

      return {
        expense: newExpense,
        participants: newParticipants,
      };
    });

    function flatten(error: Effect.Effect.Error<typeof create>) {
      return Effect.fail(
        Match.value(error).pipe(
          Match.tag(
            "DatabaseReadError",
            "DatabaseWriteError",
            "ExpenseNotCreatedError",
            "ParticipantsNotCreatedError",
            () => new ExpenseNotCreatedError("Failed parsing expense", error)
          ),
          Match.tag(
            "UserMissingInParse",
            "NoMemberMatchFound",
            "ExpenseParsingError",
            () => new ExpenseParsingError("Failed parsing expense", error)
          ),
          Match.orElse((rest) => rest)
        )
      );
    }

    return pipe(create, Effect.catchAll(flatten));
  }
}
