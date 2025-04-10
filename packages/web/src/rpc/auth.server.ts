import { createClient } from "@openauthjs/openauth/client";
import { constants } from "../lib/utils";
import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { users } from "@blank/core/db";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { serverResult } from "@/lib/neverthrow/serialize";
import { ErrUtils, CustomError } from "@/lib/errors";
import { Tokens } from "@/lib/auth/client";
import { TokenUtils } from "@/lib/auth/server";
import { authenticate, verify } from "@/lib/auth";

// TODO: fix all this nonsense, we should use regular errors
// https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5
// https://medium.com/@Nelsonalfonso/understanding-custom-errors-in-typescript-a-complete-guide-f47a1df9354c
type LoginError =
  | { type: "MissingAccessToken" }
  | { type: "VerificationError"; error: unknown } // Capture the original error
  | { type: "VerificationSuccessButNoTokens" }
  | { type: "InvalidHost" }
  | { type: "AuthorizationError"; error: unknown };

const missingAccessTokenError = () => new Error("No access token present");
const noTokensError = (): LoginError => ({
  type: "VerificationSuccessButNoTokens",
});
const invalidHostError = (): LoginError => ({ type: "InvalidHost" });

export const keys = {
  refresh: "refresh_token",
  access: "access_token",
};

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

const TokensError = CustomError("Error Setting Tokens", "TokensError");
const UserNotFound = CustomError("User Not Found", "UserError");
const Errors = {
  Tokens: {
    Get: ErrUtils(
      new TokensError("An error occurred while getting the tokens.")
    ),
    Write: ErrUtils(
      new TokensError("An error occurred while setting the cookie.")
    ),
    NotPresent: ErrUtils(
      (t: string[]) =>
        new TokensError(
          `The provided tokens: [${t.join(", ")}] were not present.`
        )
    ),
  },
  User: {
    NotFound: ErrUtils(new UserNotFound()),
  },
};

const openauth = createClient({
  clientID: constants.authClientId,
  issuer: constants.authServer,
});

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
const assertAccessTokenPresent = (tokens: Partial<Tokens>) => {
  return !tokens.access
    ? err(missingAccessTokenError())
    : ok({ access: tokens.access, refresh: tokens.refresh });
};

function authenticateInternal() {
  const Tokens = TokenUtils();

  return Tokens.getFromCookies()
    .asyncAndThen(authenticate)
    .andTee((v) => v.tokens && Tokens.setToCookies(v.tokens));
}

export const authenticateRPC = createServerFn().handler(async () => {
  return serverResult(await authenticateInternal());
});

// NOTE: no neverthrow
export const loginRPC = createServerFn().handler(async () => {
  const utils = TokenUtils();

  const verified = await TokenUtils()
    .getFromCookies()
    .andThen(assertAccessTokenPresent)
    .asyncAndThen(verify);

  const processed = verified
    .andThen((verified) =>
      verified.tokens ? ok(verified.tokens) : err(noTokensError())
    )
    .andThrough(utils.setToCookies)
    .map(() => redirect({ href: "/" }));

  if (processed.isOk()) {
    throw processed.value;
  }

  const result = await ok(getHeader("host"))
    .andThen((host) => (host ? ok(host) : err(invalidHostError())))
    .andThen((host) =>
      ok([host, host.includes("localhost") ? "http" : "https"])
    )
    .asyncAndThen(([host, protocol]) =>
      ResultAsync.fromThrowable(() =>
        openauth.authorize(`${protocol}://${host}/api/auth/callback`, "code")
      )()
    );

  if (result.isErr()) {
    throw result.error;
  }

  throw redirect({ href: result.value.url });
});

// NOTE: no neverthrow
export const logoutRPC = createServerFn().handler(() => {
  const tokens = TokenUtils();

  tokens.deleteFromCookies();

  throw redirect({ to: "/landing" });
});

export const getAuthenticatedUserRPC = createServerFn().handler(async () => {
  const tokens = TokenUtils().getFromCookies();

  const user = await authenticateInternal()
    .andThen((openauth) =>
      users.getAuthenticatedUser(openauth.subject.properties.userID)
    )
    .andThen((user) => (user ? ok(user) : Errors.User.NotFound.neverthrow()))
    .orTee(console.error);

  return serverResult(
    Result.combine([
      user,
      tokens.andThen(assertAccessTokenPresent).map((t) => t.access),
    ])
  );
  // if (user.isErr()) {
  //   throw redirect({ to: "/landing" }); // this isn't getting used for some reason
  // } else {
  //   return serverResult(
  //     Result.combine([
  //       ok(user.value),
  //       user,
  //       tokens.andThen(assertAccessTokenPresent).map((t) => t.access),
  //     ])
  //   );
  // }
});

export default openauth;
