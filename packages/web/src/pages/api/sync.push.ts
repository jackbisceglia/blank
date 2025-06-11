import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { AuthTokens } from "@/server/utils";
import { authenticate } from "@/server/auth/core";
import {
  createServerMutators,
  processor,
} from "@/server/lib/server-mutators.ts";
import { getHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

function getBearer() {
  const header = v.pipe(
    v.string("Authorization header is required"),
    v.startsWith("Bearer ", "Authorization header must start with Bearer"),
    v.transform((s) => s.split(" ").at(1)),
    v.string("Bearer Token is required")
  );

  const authorization = v.safeParse(header, getHeader("Authorization"));

  if (!authorization.success) throw new Error(authorization.issues[0].message);

  return authorization.output;
}

export const APIRoute = createAPIFileRoute("/api/sync/push")({
  POST: async ({ request }) => {
    try {
      const auth = await authenticate({
        bearer: getBearer(),
        cookies: AuthTokens.cookies,
      });

      try {
        const result = await processor.process(
          createServerMutators(auth?.subject.properties),
          Object.fromEntries(new URL(request.url).searchParams),
          await request.json()
        );
        return json(result);
      } catch (error) {
        console.error(error);
        return json({ error: "Failed to process push" }, { status: 500 });
      }
    } catch (error) {
      console.error("error authenticating: ", error);
    }

    return json({ status: "false" });
  },
});
