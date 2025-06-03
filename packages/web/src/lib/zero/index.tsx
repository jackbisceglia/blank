import { Query } from "@rocicorp/zero";
import { Schema } from "@blank/zero";
import { createUseZero, useQuery, UseQueryOptions } from "@rocicorp/zero/react";
import { ClientMutators } from "../client-mutators";

export type Zero = ReturnType<typeof useZero>;
export type QueryStatus = "not-found" | "empty" | "loading" | "success";

export const CACHE = {
  NONE: { ttl: "none" },
  HOUR: { ttl: "1h" },
  DAY: { ttl: "1d" },
  FOREVER: { ttl: "1d" },
} as const;

export const ZERO_CACHE_DEFAULT = CACHE.DAY;

const useZeroInternal = createUseZero<Schema, ClientMutators>();

export function useZero() {
  return useZeroInternal();
}

type StatusType = "complete" | "unknown";

export const computeListQueryStatus = function (
  type: StatusType,
  data: unknown
) {
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

export const computeRecordQueryStatus = function (
  type: StatusType,
  data: unknown
) {
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
