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
import {
  orElseRoot,
  RETURN_TO_KEY,
  sanitizeReturnTo,
} from "../../server/auth/return-to";

class NoCodeError extends TaggedError("NoCodeError") {}
class TokenExchangeError extends TaggedError("TokenExchangeError") {}

const appSearchParams = [RETURN_TO_KEY] as const;
const serverSearchParams = ["code", "state"] as const;

const allSearchParams = [...appSearchParams, ...serverSearchParams];

function createRedirectUrlUtils(urlString: string) {
  const url = new URL(urlString);

  const getAlLSearchParams = () => {
    return allSearchParams
      .map((key) => url.searchParams.get(key))
      .map((search) => search ?? undefined);
  };

  const stripServerSearchParams = () => {
    serverSearchParams.forEach((key) => url.searchParams.delete(key));
  };

  const createUrl = () => {
    const baseUrl = getBaseUrl();
    const restUrl = url.pathname + url.search;

    const mergedUrl = new URL(restUrl, baseUrl);

    return mergedUrl.toString();
  };

  return {
    url: createUrl,
    getAlLSearchParams,
    stripServerSearchParams,
  };
}

export const ServerRoute = createServerFileRoute("/api/auth/callback").methods({
  GET: async ({ request }) => {
    const Callback = Effect.gen(function* () {
      const utils = createRedirectUrlUtils(request.url);

      const [returnTo, code, _] = utils.getAlLSearchParams();

      if (!code) {
        return yield* new NoCodeError("Code not found");
      }

      utils.stripServerSearchParams();

      const exchanged = yield* Effect.tryPromise(() =>
        openauth.exchange(code, utils.url()),
      );

      if (exchanged.err) {
        return yield* new TokenExchangeError(
          "Could not exchange token",
          exchanged.err,
        );
      }

      AuthTokens.cookies.set(exchanged.tokens);

      const cookies = parseCookies();

      const to = yield* sanitizeReturnTo(returnTo);

      return redirect({
        headers: cookies,
        reloadDocument: true,
        to: to.pipe(orElseRoot),
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
