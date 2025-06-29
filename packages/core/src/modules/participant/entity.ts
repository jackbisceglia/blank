import { and, eq } from "drizzle-orm";
import { db } from "../../lib/drizzle";
import { DatabaseWriteError, Transaction } from "../../lib/drizzle/utils";
import { TaggedError, requireSingleElement } from "../../lib/effect";
import { participantTable, ParticipantInsert } from "./schema";
import { Effect, pipe } from "effect";

class ParticipantNotCreatedError extends TaggedError(
  "ParticipantNotCreatedError",
) {}
class ParticipantNotDeletedError extends TaggedError(
  "ParticipantNotDeletedError",
) {}
class ParticipantsNotDeletedError extends TaggedError(
  "ParticipantsNotDeletedError",
) {}
class DuplicateParticipantError extends TaggedError(
  "DuplicateParticipantError",
) {}
class ParticipantsNotCreatedError extends TaggedError(
  "ParticipantsNotCreatedError",
) {}

export namespace participants {
  export function create(participant: ParticipantInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).insert(participantTable).values(participant).returning(),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () =>
            new ParticipantNotCreatedError("Participant was not inserted"),
          dup: () =>
            new DuplicateParticipantError("Duplicate participant inserted"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating participant", e),
      ),
    );
  }

  export function createMany(
    participants: ParticipantInsert[],
    tx?: Transaction,
  ) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).insert(participantTable).values(participants).returning(),
      ),
      Effect.flatMap((rows) => {
        return rows.length === participants.length
          ? Effect.succeed(rows)
          : Effect.fail(
              new ParticipantsNotCreatedError("Participants were not inserted"),
            );
      }),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating participants", e),
      ),
    );
  }

  export function remove(groupId: string, expenseId: string, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .delete(participantTable)
          .where(
            and(
              eq(participantTable.groupId, groupId),
              eq(participantTable.expenseId, expenseId),
            ),
          )
          .returning({
            groupId: participantTable.groupId,
            expenseId: participantTable.expenseId,
          }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () =>
            new ParticipantNotDeletedError("Participant not deleted"),
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
        (tx ?? db).delete(participantTable).returning({
          groupId: participantTable.groupId,
          expenseId: participantTable.expenseId,
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to delete groups", e),
      ),
    );
  }
}
