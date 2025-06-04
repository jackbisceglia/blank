import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { AuthTokens } from "@/server/utils";
import { authenticate } from "@/server/auth/core";
import {
  createServerMutators,
  processor,
} from "@/server/lib/server-mutators.ts";

export const APIRoute = createAPIFileRoute("/api/sync/push")({
  POST: async ({ request }) => {
    try {
      const auth = await authenticate({
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
