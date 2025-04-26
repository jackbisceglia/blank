import { Zero as ZeroInternal } from "@rocicorp/zero";
import { Schema, schema } from "@blank/zero";
import { constants } from "@/lib/utils";
import {
  createUseZero,
  useQuery as useZeroQuery,
  ZeroProvider as ZeroProviderInternal,
} from "@rocicorp/zero/react";
import { useAuthentication } from "./auth.provider";
import { PropsWithChildren } from "react";
import { ClientMutators, createClientMutators } from "./data.mutators";
import {
  queryOptions,
  useQuery as useQueryTanstack,
} from "@tanstack/react-query";

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

const useZeroInternal = createUseZero<Schema, ClientMutators>();

export function useZero() {
  const client = useZeroInternal();

  return {
    z: client,
    useQuery: useZeroQuery,
  } as const;
}

export type Zero = ReturnType<typeof useZero>["z"];

export function createZero(userId: string, getToken: () => Promise<string>) {
  return new ZeroInternal({
    userID: userId,
    auth: getToken,
    server: constants.syncServer,
    schema,
    kvStore: "idb",
    mutators: createClientMutators({
      userID: userId,
    }),
  });
}

export type ZeroInstance = ReturnType<typeof createZero>;

const zeroQueryOptions = (userId: string, getToken: () => Promise<string>) =>
  queryOptions({
    queryKey: ["zero"],
    queryFn: () => {
      return createZero(userId, getToken);
    },
  });

export const ZeroProvider = (props: PropsWithChildren) => {
  const auth = useAuthentication();
  const zeroQuery = useQueryTanstack(
    zeroQueryOptions(auth.user.id, auth.getAccessToken)
  );

  if (zeroQuery.status === "pending") {
    return null;
  }

  if (zeroQuery.status === "error") {
    return <div>Issue syncing data, please try again later</div>;
  }

  return (
    <ZeroProviderInternal zero={zeroQuery.data}>
      {props.children}
    </ZeroProviderInternal>
  );
};
