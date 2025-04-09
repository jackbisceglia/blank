import { TokenUtils } from "@/lib/auth/server";
import openauth from "@/rpc/auth.server";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }) => {
    const tokens = TokenUtils();
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return json({ error: "No code provided" }, { status: 400 });
    }

    const exchanged = await openauth.exchange(
      code,
      `${url.origin}/api/auth/callback`
    );

    if (exchanged.err) return json(exchanged.err, { status: 400 });

    tokens.setToCookies(exchanged.tokens);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  },
});
