import { subjects } from "@blank/auth/subjects";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { authenticate, openauth } from "@/server/auth/core";
import { AuthTokens, getBaseUrl } from "@/server/utils";
import { evaluate } from "@/lib/utils";
import { optional } from "@blank/core/lib/utils/index";
import {
  sanitizeReturnTo,
  ROOT,
  RETURN_TO_KEY,
} from "@/lib/authentication/return-to";

const inputs = { login: v.object({ returnTo: v.optional(v.string()) }) };

export const authenticateRPC = createServerFn().handler(async function () {
  return authenticate({ cookies: AuthTokens.cookies });
});

export const loginRPC = createServerFn()
  .validator(inputs.login)
  .handler(async function ({ data }) {
    const { access, refresh } = AuthTokens.cookies.get();

    const returnTo = sanitizeReturnTo(data?.returnTo) ?? ROOT;

    if (access) {
      const verified = await openauth.verify(subjects, access, {
        ...optional({ refresh }),
      });

      if (!verified.err && verified.tokens) {
        AuthTokens.cookies.set(verified.tokens);
        throw redirect({ to: returnTo });
      }
    }

    const uri = evaluate(() => {
      const search =
        returnTo !== ROOT
          ? `?${RETURN_TO_KEY}=${encodeURIComponent(returnTo)}`
          : "";

      const path = [getBaseUrl(), "api", "auth", "callback"].join("/");

      return `${path}${search}`;
    });

    if (!uri) throw new Error("Failed to get callback URL");

    const { url } = await openauth.authorize(uri, "code");

    throw redirect({ href: url });
  });

export const logoutRPC = createServerFn().handler(function () {
  AuthTokens.cookies.delete();
  throw redirect({ to: "/landing", reloadDocument: true });
});
