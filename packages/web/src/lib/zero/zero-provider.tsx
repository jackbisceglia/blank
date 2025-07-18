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
import { Zero } from ".";
import { preload } from "@/pages/_protected/@data/preload";

export const ZeroProvider = (props: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const authentication = useAuthentication();

  const options = useMemo(() => {
    return {
      schema,
      userID: authentication.user.id,
      auth: async () => {
        const payload = Result.fromThrowable(
          () => UnsecuredJWT.decode(authentication.token),
          (e) => (e instanceof JWTExpired ? e : undefined),
        )();

        if (payload.isErr() && payload.error instanceof JWTExpired) {
          await queryClient.invalidateQueries({ queryKey: ["authentication"] });
        }

        return authentication.token;
      },
      server: constants.syncServer,
      mutators: createClientMutators({ userID: authentication.user.id }),
      kvStore: "idb" as const,
      init: (zero: Zero) => {
        preload(zero, authentication.user.id);
      },
    };
  }, [authentication.user.id, authentication.token]);

  return (
    <ZeroProviderInternal {...options}>{props.children}</ZeroProviderInternal>
  );
};
