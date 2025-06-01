import { db } from ".";
import { DatabaseWriteError, Transaction } from "./utils";
import { ParticipantInsert, participantTable } from "./participant.schema";
import { pipe, Effect } from "effect";
import { requireSingleElement, TaggedError } from "../utils";

class ParticipantNotCreatedError extends TaggedError(
  "ParticipantNotCreatedError"
) {}
class DuplicateParticipantError extends TaggedError(
  "DuplicateParticipantError"
) {}
class ParticipantsNotCreatedError extends TaggedError(
  "ParticipantsNotCreatedError"
) {}

export namespace participants {
  export function create(participant: ParticipantInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).insert(participantTable).values(participant).returning()
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () =>
            new ParticipantNotCreatedError("Participant was not inserted"),
          dup: () =>
            new DuplicateParticipantError("Duplicate participant inserted"),
        })
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating participant", e)
      )
    );
  }

  export function createMany(
    participants: ParticipantInsert[],
    tx?: Transaction
  ) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).insert(participantTable).values(participants).returning()
      ),
      Effect.flatMap((rows) => {
        return rows.length === participants.length
          ? Effect.succeed(rows)
          : Effect.fail(
              new ParticipantsNotCreatedError("Participants were not inserted")
            );
      }),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating participants", e)
      )
    );
  }
}
