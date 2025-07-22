import { Effect, pipe } from "effect";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { authenticate, UserNotAuthenticatedError } from "./auth/core";
import { AuthTokens } from "./utils";
import { users } from "@blank/core/modules/user/entity";
import { requireValueExists, TaggedError } from "@blank/core/lib/effect/index";
import { notFound } from "@tanstack/react-router";

class AuthenticatedError extends TaggedError("AuthenticatedError") {}

const checkUserAuthenticated = Effect.fn("checkUserAuthenticated")(
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
  updateUser: v.object({
    name: v.pipe(
      v.string(),
      v.minLength(1, "Name must not be empty"),
      v.maxLength(50, "Name must be at most 50 characters"),
    ),
    image: v.pipe(v.string(), v.url("Image must be a valid URL")),
  }),
};

export const meRPC = createServerFn().handler(async function () {
  const authenticated = Effect.tryPromise(() =>
    authenticate({ cookies: AuthTokens.cookies }),
  );

  const user = pipe(
    authenticated,
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticatedError("Could not authenticate user"),
      }),
    ),
    Effect.map((result) => result.subject.properties.userID),
    Effect.flatMap(users.getById),
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticatedError("Could not fetch current user"),
      }),
    ),
  );

  const token = pipe(
    Effect.try(() => AuthTokens.cookies.get()),
    Effect.map((tokens) => tokens.access),
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticatedError("Could not fetch access token"),
      }),
    ),
  );

  const result = pipe(
    Effect.all([user, token]),
    Effect.map(([user, token]) => ({ user, token })),
    Effect.mapError((e) =>
      e._tag === "UserNotFoundError" || e._tag === "AuthenticatedError"
        ? notFound({ data: e.data })
        : e,
    ),
  );

  return Effect.runPromise(result);
});

export const updateUserServerFn = createServerFn()
  .validator(inputs.updateUser)
  .handler(async function ({ data }) {
    const handler = Effect.fn("updateUser")(function* () {
      const auth = yield* checkUserAuthenticated();
      const userId = auth.subject.properties.userID;

      const updatedUser = yield* users.update(userId, {
        image: data.image,
        name: data.name,
      });

      return updatedUser;
    });

    return pipe(handler(), Effect.runPromise);
  });

