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
import { User } from "@blank/core/modules/user/schema";

export const inputs = {
  createFromDescription: v.object({
    description: v.string(),
    groupId: v.string(),
    images: v.array(ImageDataUrlSchema),
  }),
};

const assertHasImageContextPerms = Effect.fn("assertHasImageContextPerms")(
  function* (user: User) {
    // TODO: in the future this should be delegated to a proper perm lookup
    // where plan corresponds to a value that can be compared to the type of permission
    if (user.plan === "base") {
      return yield* new UserAuthorizationError(
        "Images only supported for beta users",
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
        yield* assertHasImageContextPerms(user);
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
