import { createServerFn } from "@tanstack/react-start";
import { requireValueExists, TaggedError } from "@blank/core/lib/effect/index";
import { expenses } from "@blank/core/modules";
import { authenticate } from "@/server/auth/core";
import * as v from "valibot";
import { AuthTokens } from "@/server/utils";
import { Effect, pipe } from "effect";

class UserNotAuthenticatedError extends TaggedError(
  "UserNotAuthenticatedError"
) {}

const inputs = {
  createFromDescription: v.object({
    description: v.string(),
    groupId: v.string(),
  }),
};

export const createFromDescriptionServerFn = createServerFn()
  .validator(inputs.createFromDescription)
  .handler(async function (ctx) {
    const result = pipe(
      Effect.tryPromise(() => authenticate({ cookies: AuthTokens.cookies })),
      Effect.flatMap(
        requireValueExists({
          error: () => new UserNotAuthenticatedError("User not authenticated"),
        })
      ),
      Effect.flatMap((result) =>
        expenses.createFromDescription({
          userId: result.subject.properties.userID,
          groupId: ctx.data.groupId,
          description: ctx.data.description,
        })
      )
    );

    return Effect.runPromise(result);
  });
