import { Effect, pipe } from "effect";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { authenticate, UserNotAuthenticatedError } from "./auth/core";
import { AuthTokens } from "./utils";
import { preferences } from "@blank/core/modules/preference/entity";

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
  updateDefaultGroup: v.object({
    defaultGroupId: v.pipe(
      v.string(),
      v.uuid("Default group ID must be a valid UUID"),
    ),
  }),
};

export const getUserPreferencesServerFn = createServerFn().handler(
  async function () {
    const handler = Effect.fn("getUserPreferences")(function* () {
      const authentication = yield* checkUserAuthenticated();

      const userId = authentication.subject.properties.userID;

      const userPreferences = yield* preferences.getByUserId(userId);

      return userPreferences;
    });

    return pipe(handler(), Effect.runPromise);
  },
);

export const updateDefaultGroupServerFn = createServerFn()
  .validator(inputs.updateDefaultGroup)
  .handler(async function ({ data }) {
    const handler = Effect.fn("updateDefaultGroup")(function* () {
      const { subject: auth } = yield* checkUserAuthenticated();

      const updatedPreferences = yield* preferences.update(
        auth.properties.userID,
        data.defaultGroupId,
      );

      return updatedPreferences;
    });

    return pipe(handler(), Effect.runPromise);
  });
