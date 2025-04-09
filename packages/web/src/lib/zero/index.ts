import { decodeJwt } from "jose";
import { Zero as ZeroInternal } from "@rocicorp/zero";
import { schema } from "@blank/zero";
import Cookies from "js-cookie";
import { Result, ok } from "neverthrow";
import { constants } from "../utils";
import { useQuery, useZero as useZeroInternal } from "@rocicorp/zero/react";
import * as v from "valibot";
import { fromParsed } from "@blank/core/utils";

export const CACHE = {
  NONE: { ttl: "none" },
  HOUR: { ttl: "1h" },
  DAY: { ttl: "1d" },
  FOREVER: { ttl: "1d" },
} as const;

export type QueryStatus = "not-found" | "empty" | "loading" | "success";

type Type = "complete" | "unknown";
type Data = unknown;

export const computeListQueryStatus = function (type: Type, data: Data) {
  if (type === "unknown") {
    return "loading";
  }
  if ((data as Array<unknown>).length === 0) {
    return "empty";
  }
  return "success";
};

export const computeRecordQueryStatus = function (type: Type, data: Data) {
  if (type === "unknown") {
    return "loading";
  }
  if (!data) {
    return "not-found";
  }
  return "success";
};

export function useZero() {
  const client = useZeroInternal<typeof schema>();

  return {
    z: client,
    useQuery,
  } as const;
}

export type Zero = ReturnType<typeof useZero>["z"];

export function createZero(accessToken?: string) {
  const encodedJWT = accessToken ?? Cookies.get("accessToken");
  const safeDecodeJwt = Result.fromThrowable(
    decodeJwt,
    (e) => new Error("Could not decode", { cause: e })
  );

  return ok(encodedJWT)
    .andThen((unsafeEncodedJWT) => fromParsed(v.string(), unsafeEncodedJWT))
    .andThen((encodedJWT) => safeDecodeJwt(encodedJWT))
    .andThen((unsafeDecodedJWT) => {
      const schema = v.object(
        { sub: v.string() },
        "Invalid JWT: missing subject"
      );

      return fromParsed(schema, unsafeDecodedJWT);
    })
    .map(
      // map the decoded Success value on to a zero instance
      (decodedJWT) => {
        return new ZeroInternal({
          userID: decodedJWT.sub,
          auth: () => encodedJWT,
          server: constants.syncServer,
          schema,
          kvStore: "idb",
          // kvStore: "mem",
        });
      }
    );
}
