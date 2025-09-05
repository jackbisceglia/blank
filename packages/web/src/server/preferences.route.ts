import { Effect, pipe } from "effect";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { requireUserAuthenticated } from "./auth/core";
import { AuthTokens } from "./utils";
import { preferences } from "@blank/core/modules/preference/entity";

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
    const handler = Effect.fn("getUserPreferences")(
      function* () {
        const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

        const userId = auth.subject.properties.userID;

        const prefs = yield* preferences.getByUserId(userId);

        return { defaultGroupId: prefs.defaultGroupId };
      },
      Effect.catchTag("PreferenceNotFoundError", () =>
        Effect.succeed({ defaultGroupId: null }),
      ),
    );

    return pipe(handler(), Effect.runPromise);
  },
);

export const updateDefaultGroupServerFn = createServerFn()
  .validator(inputs.updateDefaultGroup)
  .handler(async function ({ data }) {
    const handler = Effect.fn("updateDefaultGroup")(function* () {
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const userId = auth.subject.properties.userID;

      const updatedPreferences = yield* preferences.upsert(
        userId,
        data.defaultGroupId,
      );

      return updatedPreferences;
    });

    return pipe(handler(), Effect.runPromise);
  });
