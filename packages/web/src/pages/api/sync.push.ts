import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { AuthTokens } from "@/server/utils";
import { authenticate } from "@/server/auth/core";
import { connectionProvider } from "@rocicorp/zero/pg";
import { schema } from "@blank/zero";
import { PushProcessor } from "@rocicorp/zero/pg";
import { OpenAuthToken } from "@blank/auth/subjects";
import { Resource } from "sst";
import postgres from "postgres";
import { createClientMutators } from "@/lib/client-mutators";

export const processor = new PushProcessor(
  schema,
  connectionProvider(postgres(Resource.Database.connection))
);

// whenever this grows, we can move it into server/server-mutators/*
export function createServerMutators(auth: OpenAuthToken | undefined) {
  const clientMutators = createClientMutators(auth);

  return {
    ...clientMutators,
  };
}

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
