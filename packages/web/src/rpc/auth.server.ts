import { createClient } from "@openauthjs/openauth/client";
import { constants } from "../lib/utils";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getHeader } from "@tanstack/react-start/server";
import { subjects } from "@blank/auth/subjects";
import { redirect } from "@tanstack/react-router";
import { users } from "@blank/core/db";
import { err, errAsync, ok, Result, ResultAsync } from "neverthrow";
import { serverResult } from "@/lib/neverthrow/serialize";
import { ErrUtils, CustomError } from "@/lib/errors";
import { fromParsed } from "@blank/core/utils";
import { Tokens } from "@/lib/auth/client";
import { TokenUtils } from "@/lib/auth/server";

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
function verify(tokens: Partial<Tokens>) {
  const { access, refresh } = tokens;

  if (!access) {
    return errAsync(new Error("No access token present"));
  }

  const result = ResultAsync.fromSafePromise(
    openauth.verify(subjects, access, { refresh })
  ).andThen((value) => (value.err ? err(value.err) : ok(value)));

  return result;
}

// NOTE: no neverthrow
export const authenticateRPC = createServerFn().handler(async () => {
  const safeSetToCookies = (tokens?: Partial<Tokens>) =>
    ok(tokens)
      .andThen((tokens) => fromParsed(Tokens, tokens))
      .andThrough(
        Result.fromThrowable(
          TokenUtils().setToCookies,
          Errors.Tokens.Write.callback
        )
      );

  const verified = await verify(TokenUtils().getFromCookies());

  verified.andThen((v) => safeSetToCookies(v.tokens));

  return serverResult(verified);
});

// NOTE: no neverthrow
export const loginRPC = createServerFn().handler(async () => {
  const tokens = TokenUtils();
  const accessToken = getCookie(keys.access);
  const refreshToken = getCookie(keys.refresh);

  if (accessToken) {
    const verified = await openauth.verify(subjects, accessToken, {
      refresh: refreshToken,
    });

    if (!verified.err && verified.tokens) {
      tokens.setToCookies(verified.tokens);
      throw redirect({ href: "/" });
    }
  }

  const host = getHeader("host");

  const protocol = host?.includes("localhost") ? "http" : "https";

  if (!host) {
    throw new Error("Invalid host");
  }

  const { url } = await openauth.authorize(
    `${protocol}://${host}/api/auth/callback`,
    "code"
  );

  throw redirect({ href: url });
});

// NOTE: no neverthrow
export const logoutRPC = createServerFn().handler(() => {
  const tokens = TokenUtils();

  tokens.deleteFromCookies();

  throw redirect({ to: "/landing" });
});

export const getAuthenticatedUserRPC = createServerFn().handler(async () => {
  const getTokens = Result.fromThrowable(
    TokenUtils().getFromCookies,
    Errors.Tokens.Get.callback
  );

  const tokens = getTokens();

  const user = await tokens
    .asyncAndThen(verify)
    .andThen((openauth) =>
      users.getAuthenticatedUser(openauth.subject.properties.userID)
    )
    .andThen((user) => {
      if (!user) {
        return Errors.User.NotFound.neverthrow();
      }

      return ok(user);
    });

  return serverResult(
    Result.combine([
      user,
      tokens.andThen((t) => {
        if (!t.access) {
          return err(new Error("No access token present"));
        }

        return ok(t.access);
      }),
    ])
  );
});

export default openauth;
