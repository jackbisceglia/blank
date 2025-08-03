import { createServerFn } from "@tanstack/react-start";
import { expenses, users } from "@blank/core/modules";
import {
  requireUserAuthenticated,
  UserAuthorizationError,
} from "@/server/auth/core";
import * as v from "valibot";
import { AuthTokens } from "@/server/utils";
import { Effect, pipe } from "effect";
import { ImageDataUrlSchema, ImageDataUrl } from "@blank/core/lib/utils/images";

export const inputs = {
  createFromDescription: v.object({
    description: v.string(),
    groupId: v.string(),
    images: v.array(ImageDataUrlSchema),
  }),
};

const assertHasImageContextPerms = Effect.fn("assertHasImageContextPerms")(
  function* (email: string) {
    const proPlanUserEmails = [
      "jackbisceglia2000@gmail.com",
      "jmjriley19@gmail.com",
    ];

    if (!proPlanUserEmails.includes(email)) {
      return yield* new UserAuthorizationError(
        "Upgrade to pro to parse images",
      );
    }
  },
);

export const createFromDescriptionServerFn = createServerFn({
  method: "POST",
})
  .validator(inputs.createFromDescription)
  .handler(async function (ctx) {
    const handler = Effect.fn("createFromDescription")(function* () {
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const user = yield* users.getById(auth.subject.properties.userID);

      if (ctx.data.images.length > 0) {
        assertHasImageContextPerms(user.email);
      }

      const expense = yield* expenses.createFromDescription({
        userId: user.id,
        groupId: ctx.data.groupId,
        description: ctx.data.description,
        images: ctx.data.images as ImageDataUrl[],
      });

      return expense;
    });

    return pipe(handler(), Effect.runPromise);
  });
