import { Zero as ZeroInternal } from "@rocicorp/zero";
import { schema } from "@blank/zero";
import { constants } from "@/lib/utils";
import {
  useQuery,
  useZero as useZeroInternal,
  ZeroProvider as ZeroProviderInternal,
} from "@rocicorp/zero/react";
import { hydrateAsyncServerResult } from "@blank/core/utils";
import { useAuthentication } from "./auth.provider";
import { PropsWithChildren, useEffect, useState } from "react";
import { meRPC } from "@/server/auth/route";

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

export function createZero(userId: string) {
  const retryAccessToken = async () => {
    return await hydrateAsyncServerResult(meRPC)
      .map(([_, token]) => token)
      .unwrapOr(undefined);
  };

  return new ZeroInternal({
    userID: userId,
    auth: retryAccessToken,
    server: constants.syncServer,
    schema,
    kvStore: "idb",
    // kvStore: "mem",
  });
}

export type ZeroInstance = ReturnType<typeof createZero>;

const CAN_NOT_INSTANTIATE_ZERO = Symbol("CAN_NOT_INSTANTIATE_ZERO");
type CanNotInstantiateZero = typeof CAN_NOT_INSTANTIATE_ZERO;

export const ZeroProvider = (props: PropsWithChildren) => {
  const auth = useAuthentication();
  const [zero, setZero] = useState<ZeroInstance | CanNotInstantiateZero | null>(
    null
  );

  useEffect(() => {
    setZero(createZero(auth.user.id));
  }, []);

  if (zero === null) {
    return null;
  }

  if (zero === CAN_NOT_INSTANTIATE_ZERO) {
    return <div>Issue syncing data, please try again later</div>;
  }

  return (
    <ZeroProviderInternal zero={zero}>{props.children}</ZeroProviderInternal>
  );
};
