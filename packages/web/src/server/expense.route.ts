import { createServerFn } from "@tanstack/react-start";
import { expenses, users } from "@blank/core/modules";
import {
  requireUserAuthenticated,
  UserAuthorizationError,
} from "@/server/auth/core";
import * as v from "valibot";
import { AuthTokens } from "@/server/utils";
import { Effect, pipe } from "effect";

const inputs = {
  createFromDescription: v.object({
    images: v.array(v.string()),
    description: v.string(),
    groupId: v.string(),
  }),
};

export const createFromDescriptionServerFn = createServerFn({
  method: "POST",
})
  .validator(inputs.createFromDescription)
  .handler(async function (ctx) {
    const handler = Effect.fn("createFromDescription")(function* () {
      const auth = yield* requireUserAuthenticated(AuthTokens.cookies);

      const user = yield* users.getById(auth.subject.properties.userID); // could set up a retry on Unknown Errors

      const proPlanUsers = [
        "jackbisceglia2000@gmail.com",
        "jmjriley19@gmail.com",
      ];
      if (ctx.data.images.length > 0 && !proPlanUsers.includes(user.email)) {
        return yield* new UserAuthorizationError(
          "Upgrade to pro to parse images",
        );
      }

      const expense = yield* expenses.createFromDescription({
        userId: user.id,
        groupId: ctx.data.groupId,
        description: ctx.data.description,
        images: ctx.data.images,
      });

      return expense;
    });

    return pipe(handler(), Effect.runPromise);
  });

// export const createFromDescriptionServerFn = createServerFn({
//   method: "POST",
// })
//   .validator(inputs.createFromDescription)
//   .handler(async function (ctx) {
//     const result = pipe(
//       requireUserAuthenticated(AuthTokens.cookies),
//       Effect.flatMap((result) => {
//         const userId = result.subject.properties.userID;
//
//         return expenses.createFromDescription({
//           userId: userId,
//           groupId: ctx.data.groupId,
//           description: ctx.data.description,
//           images: ctx.data.images,
//         });
//       }),
//     );
//
//     return Effect.runPromise(result);
//   });
