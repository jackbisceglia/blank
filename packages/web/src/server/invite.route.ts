import { Effect, pipe } from "effect";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { requireUserAuthenticated, UserAuthorizationError } from "./auth/core";
import { AuthTokens } from "./utils";
import { invites } from "@blank/core/modules/invite/entity";
import { members } from "@blank/core/modules/member/entity";
import { Transaction, withTransaction } from "@blank/core/lib/drizzle/utils";
import {
  ACTIVE_INVITE_CAPACITY,
  MEMBER_CAPACITY,
} from "@blank/core/lib/utils/constants";
import { TaggedError } from "@blank/core/lib/effect/index";
import { groups } from "@blank/core/modules/group/entity";
import { Invite } from "@blank/core/modules/invite/schema";

class DuplicateMemberError extends TaggedError("DuplicateMemberError") {}
class MemberCapacityError extends TaggedError("MemberCapacityError") {}
class InviteCapacityError extends TaggedError("InviteCapacityError") {}
class InvalidTokenError extends TaggedError("InvalidTokenError") {}

// TODO: these asserts belong in either modules or in use-cases / features
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
  action: string,
  tx?: Transaction,
) {
  const group = yield* groups.getById(groupId, tx);

  if (group.ownerId !== userId) {
    return yield* Effect.fail(
      new UserAuthorizationError(`User must be owner to ${action}`),
    );
  }
});

const assertGroupHasInviteCapacity = Effect.fn("assertGroupHasInviteCapacity")(
  function* (groupId: string, tx?: Transaction) {
    const invites = yield* groups.getPendingInvites(groupId, tx);

    if (invites.length >= ACTIVE_INVITE_CAPACITY) {
      return yield* Effect.fail(
        new InviteCapacityError(
          `Group has maximum ${ACTIVE_INVITE_CAPACITY} invites in use`,
        ),
      );
    }
  },
);

const assertGroupHasMemberCapacity = Effect.fn("assertGroupHasMemberCapacity")(
  function* (groupId: string, tx?: Transaction) {
    const members = yield* groups.getMembers(groupId, tx);

    if (members.length >= MEMBER_CAPACITY) {
      return yield* Effect.fail(
        new MemberCapacityError(
          `Group can't have more than ${MEMBER_CAPACITY} members`,
        ),
      );
    }
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
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const userId = auth.subject.properties.userID;

      const tokens = yield* withTransaction(
        Effect.fn("getInvitesByGroupTx")(function* (tx) {
          yield* assertUserIsOwner(data.groupId, userId, "view invites", tx);

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
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const userId = auth.subject.properties.userID;

      const token = yield* withTransaction(
        Effect.fn("createGroupInviteTx")(function* (tx) {
          yield* assertUserIsOwner(data.groupId, userId, "create invite", tx);

          yield* assertGroupHasInviteCapacity(data.groupId, tx);
          yield* assertGroupHasMemberCapacity(data.groupId, tx);

          return yield* invites.create({ groupId: data.groupId });
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
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const userId = auth.subject.properties.userID;

      const result = yield* withTransaction(
        Effect.fn("revokeInviteTx")(function* (tx) {
          yield* assertUserIsOwner(data.groupId, userId, "revoke invite", tx);

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
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const userId = auth.subject.properties.userID;

      return yield* withTransaction(
        Effect.fn("joinGroupTx")(function* (tx) {
          yield* assertUserIsNotAMember(userId, data.groupId, tx);

          yield* assertGroupHasMemberCapacity(data.groupId, tx);

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
              userId: userId,
            },
            tx,
          );

          yield* invites.updateStatus(token.token, "accepted", tx);

          return member;
        }),
      ).pipe(
        // user facing error mappings
        Effect.catchTag("InviteNotFoundError", "InvalidTokenError", () =>
          Effect.fail(new InvalidTokenError("Invalid invite")),
        ),
        Effect.catchTag("GroupNotFoundError", "MembersNotFoundError", () =>
          Effect.fail(new InvalidTokenError("Invalid invite, group not found")),
        ),
        Effect.catchTag("MemberCapacityError", () =>
          Effect.fail(new InvalidTokenError("Invalid invite, group full")),
        ),
        Effect.catchTag("DuplicateMemberError", () =>
          Effect.fail(
            new InvalidTokenError("Invalid invite, already a member"),
          ),
        ),
        Effect.catchTag(
          "DatabaseReadError",
          "DatabaseWriteError",
          "DatabaseTransactionError",
          () => Effect.fail(new InvalidTokenError("Try again later")),
        ),
      );
    });

    return pipe(handler(), Effect.tap(Effect.logError), Effect.runPromise);
  });
