import { Console, Effect, pipe } from "effect";
import { requireSingleElement, TaggedError } from "../../lib/effect";
import {
  findClosestMatch,
  MIN_MATCH_THRESHOLD,
} from "../../lib/utils/string-similarity";
import {
  DatabaseWriteError,
  Transaction,
  withTransaction,
} from "../../lib/drizzle/utils";
import { ParticipantInsert } from "../participant/schema";
import { expenseTable } from "./schema";
import { ExpenseInsert } from "./schema";
import { db } from "../../lib/drizzle";
import { groups } from "../group/entity";
import { nl } from "../../lib/ai/nl";
import { unwrapOrThrow } from "../../lib/_legacy/neverthrow";
import { participants } from "../participant/entity";
import { Member } from "../member/schema";

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

      const result = yield* withTransaction((tx) =>
        Effect.gen(function* () {
          const newExpense = yield* expenses.create(
            {
              amount: generated.expense.amount,
              description: generated.expense.description,
              groupId: options.groupId,
              date: options.date,
            },
            tx
          );

          const newParticipants = yield* participants.createMany(
            merged.map((m) => ({
              groupId: options.groupId,
              expenseId: newExpense.id,
              ...m,
            })),
            tx
          );

          return {
            expense: newExpense,
            participants: newParticipants,
          };
        })
      );

      return result;
    });

    function flatten(error: Effect.Effect.Error<typeof create>) {
      const consolidate = () => {
        switch (error._tag) {
          case "DatabaseReadError":
          case "DatabaseWriteError":
          case "ExpenseNotCreatedError":
          case "ParticipantsNotCreatedError":
            return new ExpenseNotCreatedError("Failed creating expense", error);
          case "UserMissingInParse":
          case "NoMemberMatchFound":
          case "ExpenseParsingError":
            return new ExpenseParsingError("Failed parsing expense", error);
          default:
            return error;
        }
      };

      return Effect.fail(consolidate());
    }

    return pipe(
      create,
      Effect.tapError(Console.error),
      Effect.catchAll(flatten)
    );
  }
}
