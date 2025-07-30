import { openauth } from "@/server/auth/core";
import { AuthTokens, getBaseUrl } from "@/server/utils";
import {
  createServerFileRoute,
  parseCookies,
} from "@tanstack/react-start/server";
import { Effect } from "effect";
import { TaggedError } from "@blank/core/lib/effect/index";
import { capitalizedToSnake } from "@blank/core/lib/utils/index";
import { redirect } from "@tanstack/react-router";

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
        openauth.exchange(code, `${getBaseUrl()}/api/auth/callback`),
      );

      if (exchanged.err) {
        return yield* new TokenExchangeError(
          "Could not exchange token",
          exchanged.err,
        );
      }

      AuthTokens.cookies.set(exchanged.tokens);

      const cookies = parseCookies();

      return redirect({
        headers: cookies,
        reloadDocument: true,
        to: "/",
        statusCode: 302,
      });
    }).pipe(
      Effect.tapError(Effect.logError),
      Effect.catchAll((error) => {
        const param = capitalizedToSnake(error.message);

        return Effect.succeed(
          redirect({
            to: "/",
            statusCode: 302,
            headers: { Location: `/?auth_error=${param}` },
          }),
        );
      }),
    );

    return Callback.pipe(Effect.runPromise);
  },
});
