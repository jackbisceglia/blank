import { Effect, pipe, Duration } from "effect";
import {
  DatabaseReadError,
  DatabaseWriteError,
  Transaction,
} from "../../lib/drizzle/utils";
import {
  requireSingleElement,
  requireValueExists,
  TaggedError,
} from "../../lib/effect";
import { InviteInsert, inviteTable } from "./schema";
import { eq, and } from "drizzle-orm/sql";
import { db } from "../../lib/drizzle";
import { DEFAULT_INVITE_EXPIRY_UNIT } from "../../lib/utils";

class InviteNotFoundError extends TaggedError("InviteNotFoundError") {}
class InviteNotCreatedError extends TaggedError("InviteNotCreatedError") {}
class DuplicateInviteError extends TaggedError("DuplicateInviteError") {}
class InviteNotUpdatedError extends TaggedError("InviteNotUpdatedError") {}

export namespace invites {
  export function getByGroupIdAndToken(
    token: string,
    groupId: string,
    tx?: Transaction,
  ) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db).query.inviteTable.findFirst({
          where: and(
            eq(inviteTable.token, token),
            eq(inviteTable.groupId, groupId),
          ),
          with: { group: true },
        }),
      ),
      Effect.flatMap(
        requireValueExists({
          success: (invite) => invite,
          error: () => new InviteNotFoundError("Invite not found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseReadError("Failed fetching invite by token", e),
      ),
    );
  }

  type CreateInvite = Omit<
    InviteInsert,
    "expiresAt" | "status" | "createdAt" | "acceptedAt"
  >;

  export function create(invite: CreateInvite, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(inviteTable)
          .values({ ...invite, expiresAt: utils.computeExpiry("day") })
          .returning(),
      ),
      Effect.tap(Effect.logDebug),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new InviteNotCreatedError("Invite not created"),
          success: (row) => row,
          dup: () => new DuplicateInviteError("Duplicate invite found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating invite", e),
      ),
    );
  }

  export function updateStatus(
    token: string,
    status: "pending" | "accepted" | "expired",
    tx?: Transaction,
  ) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .update(inviteTable)
          .set({
            status,
            acceptedAt: status === "accepted" ? new Date() : null,
          })
          .where(eq(inviteTable.token, token))
          .returning(),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () => new InviteNotUpdatedError("Invite not updated"),
          success: (row) => row,
          dup: () => new Error("Unexpected duplicate invite update"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed updating invite status", e),
      ),
    );
  }

  export const utils = {
    computeExpiry: (duration?: "minute" | "hour" | "day" | "week"): Date => {
      const unit = duration ?? DEFAULT_INVITE_EXPIRY_UNIT;

      const now = new Date();

      const selected = Duration.decode(`1 ${unit}s`);
      const expiryMillis = now.getTime() + Duration.toMillis(selected);

      return new Date(expiryMillis);
    },
  };
}
