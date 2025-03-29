import openauth, { authenticateRPC } from "@/rpc/auth";
import { LinkProps, redirect } from "@tanstack/react-router";
import { deleteCookie, getCookie, setCookie } from "@tanstack/start/server";
import { type } from "arktype";
import { hydrateAsyncServerResult } from "@/lib/neverthrow/serialize";
import { subjects } from "@blank/auth/subjects";
import { errAsync, ResultAsync, err, ok } from "neverthrow";

const AccessToken = type.string;
type AccessToken = typeof AccessToken.infer;
const RefreshToken = type.string;
type RefreshToken = typeof RefreshToken.infer;

export const Tokens = type({
  access: AccessToken,
  refresh: RefreshToken,
});
export type Tokens = typeof Tokens.infer;

export function status<T, R>(
  status: T,
  result: R
): {
  status: T;
  result: R;
} {
  return {
    status,
    result,
  };
}

export const keys = {
  refresh: "refresh_token",
  access: "access_token",
};

export function TokenUtils() {
  return {
    getFromCookies: () => {
      return {
        access: getCookie(keys.access),
        refresh: getCookie(keys.refresh),
      };
    },
    deleteFromCookies: () => {
      deleteCookie(keys.access);
      deleteCookie(keys.refresh);
    },
    setToCookies: (tokens: Tokens) => {
      setCookie(keys.access, tokens.access, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 34560000,
      });
      setCookie(keys.refresh, tokens.refresh, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 34560000,
      });
    },
  };
}

/**
 * Verifies authentication tokens using OpenAuth
 *
 * @param tokens - Object containing access and refresh tokens
 * @param tokens.access - The access token to verify
 * @param tokens.refresh - Optional refresh token. If provided, will automatically refresh expired access tokens
 *
 * @returns ResultAsync containing either:
 *  - Success: VerifyResult with decoded subject info and possibly refreshed tokens
 *  - Error: Either "No access token present" or an OpenAuth verification error
 *
 * @example
 * const result = await verify({ access: "access_token", refresh: "refresh_token" });
 * if (result.isOk()) {
 *   const { subject, tokens } = result.value;
 * }
 */
export function verify(tokens: Partial<Tokens>) {
  const { access, refresh } = tokens;

  if (!access) {
    return errAsync(new Error("No access token present"));
  }

  const result = ResultAsync.fromSafePromise(
    openauth.verify(subjects, access, { refresh })
  ).andThen((value) => (value.err ? err(value.err) : ok(value)));

  return result;
}

/**
 * Creates a route that's only accessible when user is NOT authenticated
 *
 * @param to - Optional redirect destination other than '/'
 * @returns Empty object if user is not authenticated
 * @throws {RedirectError} Redirects to "/" or specified path if user is already authenticated
 *
 * @example
 * const loader = async () => {
 *   return createPublicOnlyRoute("/dashboard");
 * };
 */
export async function createPublicOnlyRoute(to?: Readonly<LinkProps["to"]>) {
  const authenticate = () => hydrateAsyncServerResult(authenticateRPC);

  return await authenticate().match(
    function success() {
      throw redirect({ to: to ?? "/" });
    },
    function error() {
      return {};
    }
  );
}
