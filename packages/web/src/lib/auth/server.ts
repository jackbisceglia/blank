import { keys } from "@/rpc/auth.server";
import {
  getCookie,
  deleteCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { Tokens } from "./client";

const TokensError = CustomError("Error Setting Tokens", "TokensError");

export const Errors = {
  Tokens: {
    Get: new TokensError("An error occurred while getting the tokens."),
    Write: new TokensError("An error occurred while setting the cookie."),
    Delete: new TokensError("An error occurred while deleting the cookie."),
    NotPresent: (t: string[]) =>
      new TokensError(
        `The provided tokens: [${t.join(", ")}] were not present.`
      ),
  },
};

import { Result } from "neverthrow";
import { CustomError } from "../errors";

export function TokenUtils() {
  const safeGet = (key: string) =>
    Result.fromThrowable(() => {
      return getCookie(key);
    })().mapErr(() => Errors.Tokens.NotPresent([key]));

  const safeDelete = (key: string) =>
    Result.fromThrowable(() => {
      deleteCookie(key);
    })().mapErr(() => Errors.Tokens.Delete);

  // can't access the type for this function sadly
  const safeSet = (
    key: string,
    value: string,
    options: Parameters<typeof setCookie>[3]
  ) => {
    return Result.fromThrowable(() => {
      setCookie(key, value, options);
    })().mapErr(() => Errors.Tokens.Write);
  };

  return {
    getFromCookies: () => {
      const access = safeGet(keys.access);
      const refresh = safeGet(keys.refresh);

      return Result.combine([access, refresh]).map(([access, refresh]) => ({
        access,
        refresh,
      }));
    },
    deleteFromCookies: () => {
      const access = safeDelete(keys.access);
      const refresh = safeDelete(keys.refresh);

      return Result.combine([access, refresh]).map(() => undefined);
    },
    setToCookies: (tokens: Tokens) => {
      const options = {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 34560000,
      } as const;

      const access = safeSet(keys.access, tokens.access, options);
      const refresh = safeSet(keys.refresh, tokens.refresh, options);

      return Result.combine([access, refresh]).map(() => undefined);
    },
  };
}
