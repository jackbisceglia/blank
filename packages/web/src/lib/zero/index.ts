import { decodeJwt } from "jose";
import { Zero } from "@rocicorp/zero";
import { schema } from "@blank/zero";
import Cookies from "js-cookie";
import { Result, ok, err } from "neverthrow";
import { type } from "arktype";
import { constants } from "../utils";

export function createZero(accessToken?: string) {
  const encodedJWT = accessToken ?? Cookies.get("accessToken");

  return ok(encodedJWT)
    .andThen((unsafeEncodedJWT) => {
      // validate encoded jwt as string & propagate potential error
      const validated = type.string(unsafeEncodedJWT);

      if (validated instanceof type.errors) {
        return err(new Error(validated.summary));
      }

      return ok(validated);
    })
    .andThen((encodedJWT) =>
      // decode jwt & propagate potential error
      Result.fromThrowable(
        decodeJwt,
        (e) => new Error("Could not decode", { cause: e })
      )(encodedJWT)
    )
    .andThen((unsafeDecodedJWT) => {
      // validate decoded jwt to have a 'sub' property & propagate potential error
      const validated = type({ sub: "string" })(unsafeDecodedJWT);

      if (validated instanceof type.errors) {
        return err(new Error("Invalid JWT: missing subject"));
      }

      return ok(validated);
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
