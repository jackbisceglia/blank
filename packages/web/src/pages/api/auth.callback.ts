import { openauth } from "@/server/auth/core";
import { AuthTokens } from "@/server/utils";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { Effect } from "effect";
import { TaggedError } from "@blank/core/lib/effect/index";
import { capitalizedToSnake } from "@blank/core/lib/utils/index";

class NoCodeError extends TaggedError("NoCodeError") {}
class TokenExchangeError extends TaggedError("TokenExchangeError") {}

export const ServerRoute = createServerFileRoute("/api/auth/callback").methods({
  GET: async ({ request }) => {
    const Callback = Effect.gen(function* () {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");

      if (!code) {
        return yield* new NoCodeError("Code not found");
      }

      const exchanged = yield* Effect.tryPromise(() =>
        openauth.exchange(code, `${url.origin}/api/auth/callback`),
      );

      if (exchanged.err) {
        return yield* new TokenExchangeError(
          "Could not exchange token",
          exchanged.err,
        );
      }

      AuthTokens.cookies.set(exchanged.tokens);

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }).pipe(
      Effect.tapError(Effect.logError),
      Effect.catchAll((error) => {
        const param = capitalizedToSnake(error.message);

        return Effect.succeed(
          new Response(null, {
            status: 302,
            headers: { Location: `/?auth_error=${param}` },
          }),
        );
      }),
    );

    return Callback.pipe(Effect.runPromise);
  },
});
