import { getHeader } from "@tanstack/react-start/server";
import { subjects } from "@blank/auth/subjects";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { users } from "@blank/core/db";
import { requireValueExists, TaggedError } from "@blank/core/utils";
import { authenticate, openauth } from "@/server/auth/core";
import { AuthTokens } from "@/server/utils";
import { Effect, pipe } from "effect";
import { evaluate } from "@/lib/utils";

class AuthenticatedError extends TaggedError("AuthenticatedError") {}

export const authenticateRPC = createServerFn().handler(async function () {
  return authenticate({ cookies: AuthTokens.cookies });
});

export const meRPC = createServerFn().handler(async function () {
  const authenticated = Effect.tryPromise(() =>
    authenticate({ cookies: AuthTokens.cookies })
  );

  const user = pipe(
    authenticated,
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticatedError("Could not authenticate user"),
      })
    ),
    Effect.map((result) => result.subject.properties.userID),
    Effect.flatMap(users.getById),
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticatedError("Could not fetch current user"),
      })
    )
  );

  const token = pipe(
    Effect.try(() => AuthTokens.cookies.get()),
    Effect.map((tokens) => tokens.access),
    Effect.flatMap(
      requireValueExists({
        error: () => new AuthenticatedError("Could not fetch access token"),
      })
    )
  );

  const result = pipe(
    Effect.all([user, token]),
    Effect.map(([user, token]) => ({ user, token }))
  );

  return Effect.runPromise(result);
});

export const loginRPC = createServerFn().handler(async function () {
  const { access, refresh } = AuthTokens.cookies.get();

  if (access) {
    const verified = await openauth.verify(subjects, access, { refresh });

    if (!verified.err && verified.tokens) {
      AuthTokens.cookies.set(verified.tokens);
      throw redirect({ to: "/" });
    }
  }

  const uri = evaluate(() => {
    const host = getHeader("host");
    const protocol = host?.includes("localhost") ? "http" : "https";

    return host ? `${protocol}://${host}/api/auth/callback` : null;
  });

  if (!uri) throw new Error("Failed to get callback URL"); // should be a result eventually

  const { url } = await openauth.authorize(uri, "code");

  throw redirect({ href: url });
});

export const logoutRPC = createServerFn().handler(function () {
  AuthTokens.cookies.delete();
  throw redirect({ to: "/landing" });
});
