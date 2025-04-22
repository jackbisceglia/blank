import { createServerFn } from "@tanstack/react-start";
import { expenses } from "@blank/core/db";
import { serverResult } from "@blank/core/utils";
import { authenticate } from "@/server/auth/core";
import * as v from "valibot";
import { err, ok } from "neverthrow";
import { AuthTokens } from "@/server/utils";

const inputs = {
  createFromDescription: v.object({
    description: v.string(),
    groupId: v.string(),
  }),
};

export const createFromDescriptionServerFn = createServerFn()
  .validator(inputs.createFromDescription)
  .handler(async function (ctx) {
    const subject = ok(
      await authenticate({ cookies: AuthTokens.cookies })
    ).andThen((result) => {
      return !!result
        ? ok(result.subject.properties)
        : err("Could not find user"); // [error] add tagged error
    });

    const result = await subject
      .asyncAndThen((subject) =>
        expenses.createFromDescription({
          userId: subject.userID,
          groupId: ctx.data.groupId,
          description: ctx.data.groupId,
        })
      )
      .map((value) => value)
      .mapErr((e) => e);

    return serverResult(result);
  });
