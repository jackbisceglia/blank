// SERVER ONLY UTILS
import * as v from "valibot";
import {
  setCookie,
  getCookie,
  deleteCookie,
} from "@tanstack/react-start/server";

const normalizeServerUrl = (url: string) =>
  url.endsWith("/") ? url.slice(0, -1) : url;

export const constants = {
  authClientId: "blank-auth-web",
  authServerUrl: normalizeServerUrl(
    import.meta.env.VITE_AUTH_SERVER_URL as string,
  ),
};

export const getBaseUrl = () => {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  return `${protocol}://${import.meta.env.VITE_APP_URL as string}`;
};

const tokenMessage = "token must be a string";

const Tokens = v.object({
  access: v.pipe(v.string(tokenMessage), v.minLength(1)),
  refresh: v.pipe(v.string(tokenMessage), v.minLength(1)),
});

export type Tokens = v.InferOutput<typeof Tokens>;
export type AccessToken = v.InferOutput<typeof Tokens.entries.access>;
export type RefreshToken = v.InferOutput<typeof Tokens.entries.refresh>;

// Get lowercase token type keys from tokens object
type Options = { omit?: (keyof Tokens)[] };

export const AuthTokens = {
  keys: {
    access: "access_token",
    refresh: "refresh_token",
  } as const,
  opts: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 34560000,
  } as const,
  tokens: ["access", "refresh"] as (keyof Tokens)[],
  shouldOmit(options: Options | undefined, ...keys: (keyof Tokens)[]) {
    return keys.map((token) => options?.omit?.includes(token));
  },
  cookies: {
    set(tokens: Tokens, options?: Options) {
      const [shouldOmitAccess, shouldOmitRefresh] = AuthTokens.shouldOmit(
        options,
        ...AuthTokens.tokens,
      );

      if (!shouldOmitAccess) {
        setCookie(AuthTokens.keys.access, tokens.access, AuthTokens.opts);
      }
      if (!shouldOmitRefresh) {
        setCookie(AuthTokens.keys.refresh, tokens.refresh, AuthTokens.opts);
      }
    },
    get(options?: Options) {
      const [shouldOmitAccess, shouldOmitRefresh] = AuthTokens.shouldOmit(
        options,
        ...AuthTokens.tokens,
      );

      return {
        access: shouldOmitAccess
          ? undefined
          : getCookie(AuthTokens.keys.access),
        refresh: shouldOmitRefresh
          ? undefined
          : getCookie(AuthTokens.keys.refresh),
      };
    },
    delete(options?: Options) {
      const [shouldOmitAccess, shouldOmitRefresh] = AuthTokens.shouldOmit(
        options,
        ...AuthTokens.tokens,
      );

      if (!shouldOmitAccess) {
        deleteCookie(AuthTokens.keys.access, AuthTokens.opts);
      }
      if (!shouldOmitRefresh) {
        deleteCookie(AuthTokens.keys.refresh, AuthTokens.opts);
      }
    },
  },
};
