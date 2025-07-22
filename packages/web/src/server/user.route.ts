import { Effect, pipe } from "effect";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { authenticate, UserNotAuthenticatedError } from "./auth/core";
import { AuthTokens } from "./utils";
import { users } from "@blank/core/modules/user/entity";

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

export const getCurrentUserServerFn = createServerFn().handler(
  async function () {
    const handler = Effect.fn("getCurrentUser")(function* () {
      const { subject: auth } = yield* checkUserAuthenticated();

      const user = yield* users.getById(auth.properties.userID);

      return user;
    });

    return pipe(handler(), Effect.runPromise);
  },
);

