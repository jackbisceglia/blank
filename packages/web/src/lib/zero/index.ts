import { decodeJwt } from "jose";
import { Zero } from "@rocicorp/zero";
import { schema } from "@blank/zero";
import Cookies from "js-cookie";
import { Result, ok } from "neverthrow";
import { constants } from "../utils";
import { useQuery, useZero as useZeroInternal } from "@rocicorp/zero/react";
import * as v from "valibot";
import { fromParsed } from "@blank/core/utils";

export function useZero() {
  const client = useZeroInternal<typeof schema>();

  return {
    z: client,
    useQuery,
  } as const;
}

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
        return new Zero({
          userID: decodedJWT.sub,
          auth: () => encodedJWT,
          server: constants.syncServer,
          schema,
          kvStore: "idb",
        });
      }
    );
}
