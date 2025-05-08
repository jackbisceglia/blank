import { err, ok } from "neverthrow";
import { db } from ".";
import { DrizzleResult, fromDrizzleThrowable } from "./utils";
import {
  Participant,
  ParticipantInsert,
  participantTable,
} from "./participant.schema";

const Errors = {
  UnexpectedInsertCount: (ct: number) =>
    new Error(`Expected 1 expense to be inserted, but got ${ct.toString()}`),
};

export namespace participants {
  export function create(
    participant: ParticipantInsert
  ): DrizzleResult<Participant> {
    const safelyInsertExpenseRecord = fromDrizzleThrowable(() =>
      db.insert(participantTable).values(participant).returning()
    );

    return safelyInsertExpenseRecord().andThen((ids) =>
      ids.length === 1
        ? ok(ids[0])
        : err(Errors.UnexpectedInsertCount(ids.length))
    );
  }

  export function createMany(
    participants: ParticipantInsert[]
  ): DrizzleResult<Participant[]> {
    const safelyInsertExpenseRecord = fromDrizzleThrowable(() =>
      db.insert(participantTable).values(participants).returning()
    );

    return safelyInsertExpenseRecord().andThen((ids) =>
      ids.length === participants.length
        ? ok(ids)
        : err(Errors.UnexpectedInsertCount(ids.length))
    );
  }
}
