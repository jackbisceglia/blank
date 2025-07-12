import { Zero as ZeroInternal, ZeroOptions } from "@rocicorp/zero";
import { Schema, schema } from "@blank/zero";
import { constants } from "@/lib/utils";
import { ZeroProvider as ZeroProviderInternal } from "@rocicorp/zero/react";
import { useAuthentication } from "../authentication";
import { PropsWithChildren, useMemo } from "react";
import { ClientMutators, createClientMutators } from "../client-mutators";
import { Result } from "neverthrow";
import { UnsecuredJWT } from "jose";
import { useQueryClient } from "@tanstack/react-query";
import { JWTExpired } from "jose/errors";

type Options = ZeroOptions<Schema, ClientMutators>;

export const ZeroProvider = (props: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const auth = useAuthentication();

  // TODO: preload most relevant data here

  const options = useMemo(() => {
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
    } satisfies Options;
  }, [auth.user.id, auth.token, queryClient]);

  return (
    <ZeroProviderInternal zero={new ZeroInternal(options)}>
      {props.children}
    </ZeroProviderInternal>
  );
};
