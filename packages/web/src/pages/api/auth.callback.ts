import { openauth } from "@/server/auth/core";
import { AuthTokens } from "@/server/utils";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    console.log("--------------------\n", url, code);

    if (!code) {
      return json({ error: "No code provided" }, { status: 400 });
    }

    const exchanged = await openauth.exchange(
      code,
      `${url.origin}/api/auth/callback`,
    );

    if (exchanged.err) return json(exchanged.err, { status: 400 });

    AuthTokens.cookies.set(exchanged.tokens);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  },
});
