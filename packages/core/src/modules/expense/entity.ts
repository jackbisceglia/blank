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
import { eq } from "drizzle-orm";
import { optional } from "../../lib/utils";
import { ImageDataUrl } from "../../lib/utils/images";

const USER = "USER";

class ExpenseNotCreatedError extends TaggedError("ExpenseNotCreatedError") {}
class ExpensesNotCreatedError extends TaggedError("ExpensesNotCreatedError") {}
class ExpenseNotRemovedError extends TaggedError("ExpensesNotDeletedError") {}
class DuplicateExpenseError extends TaggedError("DuplicateExpenseError") {}
class ExpenseParsingError extends TaggedError("ExpenseParsingError") {}
class UserMissingInParse extends TaggedError("UserMissingInParse") {}
class NoMemberMatchFound extends TaggedError("NoMemberMatchFound") {}

type Participant = Required<Omit<ParticipantInsert, "expenseId" | "groupId">>;
type ParticipantParse = {
  role: string;
  split: [number, number];
  name: string;
};

function createMapping(member: ParticipantParse, userId: string) {
  type Roles = "participant" | "payer";

  return {
    role: member.role as Roles,
    split: member.split,
    userId: userId,
  } satisfies Participant;
}

function findClosestName(name: string, names: string[]) {
  const [bestMatch, score] = findClosestMatch(name, names);

  return Effect.if(score >= MIN_MATCH_THRESHOLD, {
    onTrue: () => Effect.succeed(bestMatch),
    onFalse: () =>
      Effect.fail(
        new NoMemberMatchFound("Member from parse not found in group"),
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
          .returning({ id: expenseTable.id }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new ExpenseNotCreatedError("Expense not created"),
          dup: () => new DuplicateExpenseError("Duplicate expense found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating expense", e),
      ),
    );
  }

  export function createMany(expenses: ExpenseInsert[], tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(expenseTable)
          .values(expenses)
          .returning({ id: expenseTable.id }),
      ),
      Effect.flatMap((rows) => {
        return rows.length === expenses.length
          ? Effect.succeed(rows)
          : Effect.fail(
              new ExpensesNotCreatedError("Expenses were not inserted"),
            );
      }),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating expenses", e),
      ),
    );
  }

  type CreateFromDescriptionOptions = {
    groupId: string;
    userId: string;
    description: string;
    date?: Date;
    images?: ImageDataUrl[];
    parser?: "base" | "pro";
  };

  export function remove(id: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .delete(expenseTable)
          .where(eq(expenseTable.id, id))
          .returning({ id: expenseTable.id }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new ExpenseNotRemovedError("ExpenseNotRemovedError"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate group deletion"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to delete group", e),
      ),
    );
  }

  export function removeAll(tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).delete(expenseTable).returning({ id: expenseTable.id }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to delete groups", e),
      ),
    );
  }

  export function createFromDescription(options: CreateFromDescriptionOptions) {
    const create = Effect.gen(function* () {
      const members = yield* groups.getMembers(options.groupId);

      const shouldUseMultiModal =
        options.parser === "pro" && (options.images ?? []).length > 0;

      const generated = yield* Effect.tryPromise({
        try: () =>
          unwrapOrThrow(
            nl.expense.parse({
              description: options.description,
              ...optional({ images: options.images }),
              ...(shouldUseMultiModal
                ? {
                    models: {
                      fast: "mini.gpt-4.1-mini",
                      quality: "pro.gpt-4.1",
                    },
                  }
                : {}),
            }),
          ), // TODO: remove after migrate
        catch: (e) => new ExpenseParsingError("Failed parsing expense", e),
      });

      const user = generated.members.find((m) => m.name === USER);

      if (!user) {
        return yield* Effect.fail(
          new UserMissingInParse("User omitted from parse"),
        );
      }

      const userMapped = createMapping(user, options.userId);

      const restMapped = yield* normalize(
        generated.members.filter((m) => m.name !== USER),
        members,
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
            tx,
          );

          const newParticipants = yield* participants.createMany(
            merged.map((m) => ({
              groupId: options.groupId,
              expenseId: newExpense.id,
              ...m,
            })),
            tx,
          );

          return {
            expense: newExpense,
            participants: newParticipants,
          };
        }),
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
      Effect.catchAll(flatten),
    );
  }
}
