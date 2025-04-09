import { keys } from "@/rpc/auth.server";
import {
  getCookie,
  deleteCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { Tokens } from "./client";

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
