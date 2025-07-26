import { createServerFn } from "@tanstack/react-start";
import { expenses } from "@blank/core/modules";
import { requireUserAuthenticated } from "@/server/auth/core";
import * as v from "valibot";
import { AuthTokens } from "@/server/utils";
import { Effect, pipe } from "effect";

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
      requireUserAuthenticated(AuthTokens.cookies),
      Effect.flatMap((result) =>
        expenses.createFromDescription({
          userId: result.subject.properties.userID,
          groupId: ctx.data.groupId,
          description: ctx.data.description,
        }),
      ),
    );

    return Effect.runPromise(result);
  });
