import { subjects } from "@blank/auth/subjects";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authenticate, openauth } from "@/server/auth/core";
import { AuthTokens, getBaseUrl } from "@/server/utils";
import { evaluate } from "@/lib/utils";
import { optional } from "@blank/core/lib/utils/index";

export const authenticateRPC = createServerFn().handler(async function () {
  return authenticate({ cookies: AuthTokens.cookies });
});

export const loginRPC = createServerFn().handler(async function () {
  const { access, refresh } = AuthTokens.cookies.get();

  if (access) {
    const verified = await openauth.verify(subjects, access, {
      ...optional({ refresh }),
    });

    if (!verified.err && verified.tokens) {
      AuthTokens.cookies.set(verified.tokens);
      throw redirect({ to: "/" });
    }
  }

  const uri = evaluate(() => {
    return `${getBaseUrl()}/api/auth/callback`; // TODO: fix
  });

  if (!uri) throw new Error("Failed to get callback URL"); // should be a result eventually

  const { url } = await openauth.authorize(uri, "code");

  throw redirect({ href: url });
});

export const logoutRPC = createServerFn().handler(function () {
  AuthTokens.cookies.delete();
  throw redirect({ to: "/landing", reloadDocument: true });
});
