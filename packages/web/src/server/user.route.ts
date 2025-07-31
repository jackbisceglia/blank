import { Effect, pipe } from "effect";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { requireUserAuthenticated } from "./auth/core";
import { AuthTokens } from "./utils";
import { users } from "@blank/core/modules/user/entity";
import { requireValueExists, TaggedError } from "@blank/core/lib/effect/index";
import { notFound } from "@tanstack/react-router";

class AuthenticationError extends TaggedError("AuthenticationError") {}

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
  const handler = Effect.fn("updateUser")(function* () {
    const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

    const user = yield* users.getById(auth.subject.properties.userID);

    yield* requireValueExists({
      error: () => new AuthenticationError("Could not fetch current user"),
    })(user);

    const token = yield* Effect.try(() => AuthTokens.cookies.get());

    const access = yield* requireValueExists({
      success: (value: string) => value, // have to pass this to get type inference
      error: () => new AuthenticationError("Could not fetch access token"),
    })(token.access);

    return { user, token: access };
  });

  return pipe(
    handler(),
    Effect.catchTag("UserNotAuthenticatedError", () => Effect.succeed(null)),
    Effect.runPromise,
  );
});

export const meRPC2 = createServerFn().handler(async function () {
  const user = pipe(
    requireUserAuthenticated(AuthTokens.cookies),
    Effect.map((result) => result.subject.properties.userID),
    Effect.flatMap(users.getById),
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticationError("Could not fetch current user"),
      }),
    ),
    Effect.catchTag("UserNotAuthenticatedError", () => Effect.succeed(null)),
  );

  const token = pipe(
    Effect.try(() => AuthTokens.cookies.get()),
    Effect.map((tokens) => tokens.access),
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticationError("Could not fetch access token"),
      }),
    ),
  );

  const result = pipe(
    Effect.all([user, token]),
    Effect.map(([user, token]) => ({ user, token })),
    Effect.tapError((error) => {
      console.log("error in the result effect merge: ", error);

      return Effect.fail(error);
    }),
    Effect.mapError((e) =>
      e._tag === "UserNotFoundError" || e._tag === "AuthenticationError"
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
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const userId = auth.subject.properties.userID;

      const updatedUser = yield* users.update(userId, data);

      return updatedUser;
    });

    return pipe(handler(), Effect.runPromise);
  });
