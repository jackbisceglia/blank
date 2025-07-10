import { Zero as ZeroInternal } from "@rocicorp/zero";
import { schema } from "@blank/zero";
import { constants } from "@/lib/utils";
import { ZeroProvider as ZeroProviderInternal } from "@rocicorp/zero/react";
import { useAuthentication } from "../authentication";
import { PropsWithChildren, useMemo } from "react";
import { createClientMutators } from "../client-mutators";
import { Result } from "neverthrow";
import { UnsecuredJWT } from "jose";
import { useQueryClient } from "@tanstack/react-query";
import { JWTExpired } from "jose/errors";

export const ZeroProvider = (props: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const auth = useAuthentication();

  const opts = useMemo(() => {
    return {
      schema,
      userID: auth.user.id,
      auth: async () => {
        const payload = Result.fromThrowable(
          () => UnsecuredJWT.decode(auth.token),
          (e) => (e instanceof JWTExpired ? e : undefined),
        )();

        if (payload.isErr() && payload.error instanceof JWTExpired) {
          await queryClient.invalidateQueries({ queryKey: ["authentication"] });
        }

        return auth.token;
      },
      server: constants.syncServer,
      mutators: (() => {
        return createClientMutators({ userID: auth.user.id });
      })(),
      kvStore: "idb" as const,
    };
  }, [auth.user.id, auth.token, queryClient]);

  return (
    <ZeroProviderInternal zero={new ZeroInternal(opts)}>
      {props.children}
    </ZeroProviderInternal>
  );
};
