import { Query, Zero as ZeroInternal } from "@rocicorp/zero";
import { Schema, schema } from "@blank/zero";
import { constants } from "@/lib/utils";
import {
  createUseZero,
  useQuery,
  UseQueryOptions,
  ZeroProvider as ZeroProviderInternal,
} from "@rocicorp/zero/react";
import { useAuthentication } from "./auth.provider";
import { PropsWithChildren, useEffect, useState } from "react";
import { ClientMutators, createClientMutators } from "./mutators";
import { Result } from "neverthrow";
import { UnsecuredJWT } from "jose";
import { useQueryClient } from "@tanstack/react-query";
import { JWTExpired } from "jose/errors";

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

export function useListQuery<
  TSchema extends Schema,
  TTable extends keyof TSchema["tables"] & string,
  TReturn,
>(query: Query<TSchema, TTable, TReturn>, options?: UseQueryOptions) {
  const [data, status] = useQuery(query, options);

  return { data, status: computeListQueryStatus(status.type, data) } as const;
}

export const computeRecordQueryStatus = function (type: Type, data: Data) {
  if (type === "unknown") {
    return "loading";
  }
  if (!data) {
    return "not-found";
  }
  return "success";
};

export function useRecordQuery<
  TSchema extends Schema,
  TTable extends keyof TSchema["tables"] & string,
  TReturn,
>(query: Query<TSchema, TTable, TReturn>, options?: UseQueryOptions) {
  const [data, status] = useQuery(query, options);

  return { data, status: computeRecordQueryStatus(status.type, data) } as const;
}

const useZeroInternal = createUseZero<Schema, ClientMutators>();

export function useZero() {
  return useZeroInternal();
}

export type Zero = ReturnType<typeof useZero>;

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
