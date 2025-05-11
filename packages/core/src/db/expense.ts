import { err, ok } from "neverthrow";
import { db } from ".";
import { Expense, ExpenseInsert, expenseTable } from "./expense.schema";
import { DrizzleResult, fromDrizzleThrowable } from "./utils";
import { nl } from "../ai";
import { DrizzleError } from "drizzle-orm";
import { AISDKError } from "ai";
import { groups } from "./group";
import { findClosestMatch } from "../utils/string-similarity";
import { participants } from "./participant";

const USER = "USER";

const Errors = {
  UnexpectedInsertCount: (ct: number) =>
    new Error(`Expected 1 expense to be inserted, but got ${ct.toString()}`),
};

export namespace expenses {
  export function create(
    expense: ExpenseInsert
  ): DrizzleResult<Pick<Expense, "id">> {
    const safelyInsertExpenseRecord = fromDrizzleThrowable(() =>
      db.insert(expenseTable).values(expense).returning({ id: expenseTable.id })
    );

    return safelyInsertExpenseRecord().andThen((ids) =>
      ids.length === 1
        ? ok(ids[0])
        : err(Errors.UnexpectedInsertCount(ids.length))
    );
  }

  type CreateFromNlOpts = {
    groupId: string;
    description: string;
    userId: string;
  } & Partial<ExpenseInsert>;

  export function createFromDescription(
    opts: CreateFromNlOpts
  ): DrizzleResult<Pick<Expense, "id">, DrizzleError | AISDKError> {
    return nl.expense
      .parse(opts.description)
      .andThen((parsed) =>
        groups.getMembers(opts.groupId).andThen((groupMembers) => {
          const [mappings, names] = groupMembers.reduce<
            [Record<string, string>, string[]]
          >(
            (acc, member) => {
              acc[0][member.nickname] = member.userId;
              acc[1].push(member.nickname);
              return acc;
            },
            [{}, []]
          );

          const user = parsed.members.find((m) => m.name === USER);

          if (!user) {
            return err(new Error("Current user not present in parsed expense"));
          }

          const otherParticipants = parsed.members
            .filter((m) => m.name !== USER)
            .map((parsedMember) => ({
              role: parsedMember.role,
              split: parsedMember.split,
              userId: (() => {
                const minimumViableMatchScore = 0.5;
                const [bestMatch, score] = findClosestMatch(
                  parsedMember.name,
                  names
                );

                return score > minimumViableMatchScore
                  ? mappings[bestMatch]
                  : null;
              })(),
            }));

          const hasNonNullUserIds = (
            members: Array<{ userId: string | null }>
          ): members is Array<{ userId: string }> =>
            members.every((m) => m.userId !== null);

          if (!hasNonNullUserIds(otherParticipants)) {
            return err(new Error("No matching member found"));
          }

          const mergedMembers = [
            ...otherParticipants,
            {
              role: user.role,
              split: user.split,
              userId: opts.userId,
            },
          ];

          return ok({
            ...parsed,
            members: mergedMembers,
          });
        })
      )
      .andThen((normalized) => {
        return expenses
          .create({
            ...normalized.expense,
            groupId: opts.groupId,
            date: opts.date,
          })
          .andThen((created) => {
            return participants.createMany(
              normalized.members.map((m) => ({
                ...m,
                groupId: opts.groupId,
                userId: m.userId,
                expenseId: created.id,
                split: m.split.toString(), // lift out to schema
                role: m.role as "payer" | "participant", // lift out to schema
              }))
            );
          });
      })
      .map((entries) => ({ id: entries[0].expenseId }));
  }
}
