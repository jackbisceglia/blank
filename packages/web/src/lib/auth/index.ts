import openauth, { authenticateRPC } from "@/rpc/auth.server";
import { LinkProps, redirect } from "@tanstack/react-router";
import { hydrateAsyncServerResult } from "@/lib/neverthrow/serialize";
import { subjects } from "@blank/auth/subjects";
import { errAsync, ResultAsync, err, ok } from "neverthrow";
import { Tokens } from "./client";
import {
  InvalidAccessTokenError,
  InvalidRefreshTokenError,
} from "@openauthjs/openauth/error";
import { ValidationError } from "@blank/core/utils";
import { CustomError } from "../errors";

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
// NOTE: consider if this causes client/server issues in build
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

export function authenticate(tokens: Partial<Tokens>) {
  return ok(tokens)
    .asyncAndThen(verify)
    .mapErr((err) => {
      const opts = { cause: err };

      switch (true) {
        case err instanceof InvalidRefreshTokenError:
        case err instanceof InvalidAccessTokenError:
        case err instanceof ValidationError:
          return new Error("Could not access tokens from cookies", opts);
        case err instanceof CustomError:
          return new Error("Issue modifying cookies", opts);
        default:
          return err;
      }
    });
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
