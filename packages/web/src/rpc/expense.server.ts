import { createServerFn } from "@tanstack/react-start";
import { authenticateInternal } from "./auth.server";
import { serverErr, serverResult } from "@/lib/neverthrow/serialize";
import { expenses } from "@blank/core/db";
import * as v from "valibot";

export const createExpenseFromNaturalLangauge = createServerFn()
  .validator(v.object({ description: v.string(), groupId: v.string() }))
  .handler(async (ctx) => {
    const user = await authenticateInternal().map((auth) => ({
      id: auth.subject.properties.userID,
    }));

    if (user.isErr()) return serverErr(user.error);

    const result = await expenses
      .createFromDescription({
        ...ctx.data,
        userId: user.value.id,
      })
      .map((value) => {
        return value;
      })
      .mapErr((e) => {
        return e;
      });

    return serverResult(result);
  });
