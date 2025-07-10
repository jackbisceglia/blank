import { createServerFn } from "@tanstack/react-start";
import { Console, Effect, pipe } from "effect";
import * as v from "valibot";
import {
  authenticate,
  UserAuthorizationError,
  UserNotAuthenticatedError,
} from "./auth/core";
import { AuthTokens } from "./utils";
import { invites } from "@blank/core/modules/invite/entity";
import { members } from "@blank/core/modules/member/entity";
import { Transaction, withTransaction } from "@blank/core/lib/drizzle/utils";
import { TaggedError } from "@blank/core/lib/effect/index";
import { groups } from "@blank/core/modules/group/entity";
import { Invite } from "@blank/core/modules/invite/schema";

const MAX_INVITE_CAPACITY = 6;

class DuplicateMemberError extends TaggedError("DuplicateMemberError") {}
class InviteCapacityError extends TaggedError("InviteCapacityError") {}
class InvalidTokenError extends TaggedError("InvalidTokenError") {}

const assertUserIsNotAMember = Effect.fn("assertUserIsNotAMember")(function* (
  userId: string,
  groupId: string,
  tx?: Transaction,
) {
  // we need to invert default error, since we don't want the user to exist
  const member = yield* members.get(userId, groupId, tx).pipe(
    Effect.catchTag("MemberNotFoundError", () => Effect.succeed(undefined)),
    Effect.catchTag("DatabaseReadError", () => Effect.succeed(undefined)),
  );

  if (member) {
    return yield* Effect.fail(
      new DuplicateMemberError("User is already a member of the group"),
    );
  }
});

const assertTokenValid = Effect.fn("assertTokenValid")(function* (
  status: Invite["status"],
  expiresAt: Date,
) {
  if (status === "expired" || new Date(expiresAt) < new Date()) {
    return yield* Effect.fail(
      new InvalidTokenError(`Invalid Token, already expired`),
    );
  }

  if (status === "accepted") {
    return yield* Effect.fail(
      new InvalidTokenError(`Invalid Token, already accepted`),
    );
  }
});

const assertUserIsOwner = Effect.fn("assertUserIsOwner")(function* (
  groupId: string,
  userId: string,
  tx?: Transaction,
) {
  const group = yield* groups.getById(groupId, tx);

  if (group.ownerId !== userId) {
    return yield* Effect.fail(
      new UserAuthorizationError("User must be owner to create invite"),
    );
  }
});

const assertGroupHasInviteCapacity = Effect.fn("assertGroupHasInviteCapacity")(
  function* (groupId: string, tx?: Transaction) {
    const invites = yield* groups.getPendingInvites(groupId, tx);

    if (invites.length >= MAX_INVITE_CAPACITY) {
      return yield* Effect.fail(
        new InviteCapacityError(
          `Group has maximum ${MAX_INVITE_CAPACITY} invites in use`,
        ),
      );
    }
  },
);

const checkUserAuthenticated = Effect.fn("checkUserAuthenticated ")(
  function* () {
    const auth = yield* Effect.tryPromise(() =>
      authenticate({ cookies: AuthTokens.cookies }),
    );

    if (!auth) {
      return yield* new UserNotAuthenticatedError("User not authenticated");
    }

    return auth;
  },
);

const inputs = {
  getInvites: v.object({
    groupId: v.string(),
  }),
  createInviteToken: v.object({
    groupId: v.string(),
  }),
  revokeInvite: v.object({
    groupId: v.string(),
    token: v.string(),
  }),
  joinGroup: v.object({
    groupId: v.string(),
    token: v.string(),
    nickname: v.string(),
  }),
};

export const getInvitesByGroupServerFn = createServerFn()
  .validator(inputs.getInvites)
  .handler(async function ({ data }) {
    const handler = Effect.fn("getInvitesByGroup")(function* () {
      const { subject: auth } = yield* checkUserAuthenticated();

      const tokens = yield* withTransaction(
        Effect.fn("getInvitesByGroupTx")(function* (tx) {
          yield* assertUserIsOwner(data.groupId, auth.properties.userID, tx);

          return yield* groups.getPendingInvites(data.groupId);
        }),
      );

      return tokens;
    });

    return pipe(handler(), Effect.runPromise);
  });

export const createGroupInviteServerFn = createServerFn()
  .validator(inputs.createInviteToken)
  .handler(async function ({ data }) {
    const handler = Effect.fn("createGroupInvite")(function* () {
      const { subject: auth } = yield* checkUserAuthenticated();

      const token = yield* withTransaction(
        Effect.fn("createGroupInviteTx")(function* (tx) {
          yield* assertUserIsOwner(data.groupId, auth.properties.userID, tx);

          yield* assertGroupHasInviteCapacity(data.groupId, tx);

          return yield* invites.create({
            groupId: data.groupId,
            expiresAt: invites.utils.computeExpiry(),
          });
        }),
      );

      return token;
    });

    return pipe(handler(), Effect.runPromise);
  });

export const revokeInviteServerFn = createServerFn()
  .validator(inputs.revokeInvite)
  .handler(async function ({ data }) {
    const handler = Effect.fn("revokeInvite")(function* () {
      const { subject: auth } = yield* checkUserAuthenticated();

      const result = yield* withTransaction(
        Effect.fn("revokeInviteTx")(function* (tx) {
          yield* assertUserIsOwner(data.groupId, auth.properties.userID, tx);

          return yield* invites.updateStatus(data.token, "expired", tx);
        }),
      );

      return result;
    });

    return pipe(handler(), Effect.runPromise);
  });

export const joinGroupServerFn = createServerFn()
  .validator(inputs.joinGroup)
  .handler(async function ({ data }) {
    const handler = Effect.fn("joinGroup")(function* () {
      const { subject: auth } = yield* checkUserAuthenticated();

      return yield* withTransaction(
        Effect.fn("joinGroupTx")(function* (tx) {
          yield* assertUserIsNotAMember(
            auth.properties.userID,
            data.groupId,
            tx,
          );

          const token = yield* invites.getByGroupIdAndToken(
            data.token,
            data.groupId,
            tx,
          );

          yield* assertTokenValid(token.status, token.expiresAt);

          const member = yield* members.create(
            {
              groupId: data.groupId,
              nickname: data.nickname,
              userId: auth.properties.userID,
            },
            tx,
          );

          yield* invites.updateStatus(token.token, "accepted", tx);

          return member;
        }),
      );
    });

    return pipe(handler(), Effect.tap(Effect.logError), Effect.runPromise);
  });
