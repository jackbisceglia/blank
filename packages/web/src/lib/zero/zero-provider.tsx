import { Zero as ZeroInternal } from "@rocicorp/zero";
import { schema } from "@blank/zero";
import { constants } from "@/lib/utils";
import { ZeroProvider as ZeroProviderInternal } from "@rocicorp/zero/react";
import { useAuthentication } from "../authentication";
import { PropsWithChildren, useEffect, useState } from "react";
import { createClientMutators } from "../mutators";
import { Result } from "neverthrow";
import { UnsecuredJWT } from "jose";
import { useQueryClient } from "@tanstack/react-query";
import { JWTExpired } from "jose/errors";
import { Zero } from ".";

export const ZeroProvider = (props: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const auth = useAuthentication();
  const [zero, setZero] = useState<Zero | null>(null);

  useEffect(() => {
    const zero = new ZeroInternal({
      userID: auth.user.id,
      auth: async () => {
        const payload = Result.fromThrowable(
          () => UnsecuredJWT.decode(auth.token),
          (e) => (e instanceof JWTExpired ? e : undefined)
        )();

        if (payload.isErr() && payload.error instanceof JWTExpired) {
          await queryClient.invalidateQueries({ queryKey: ["authentication"] });
        }

        return auth.token;
      },
      server: constants.syncServer,
      schema,
      kvStore: "idb",
      mutators: (() => {
        return createClientMutators({ userID: auth.user.id });
      })(),
    });

    setZero(zero);
  }, [auth.user.id, auth.token, queryClient]);

  if (!zero) {
    return <div>Issue syncing data, please try again later</div>;
  }

  return (
    <ZeroProviderInternal zero={zero}>{props.children}</ZeroProviderInternal>
  );
};
