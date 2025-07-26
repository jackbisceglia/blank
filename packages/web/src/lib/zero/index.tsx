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
  data: unknown,
) {
  if (type === "unknown") {
    return "loading";
  }
  if ((data as Array<unknown>).length === 0) {
    return "empty";
  }
  return "success";
};

type ListQueryResult<T> =
  | { status: "success"; data: NonNullable<T>[] }
  | { status: "empty"; data: [] }
  | { status: "loading"; data: undefined };

export function useListQuery<
  TSchema extends Schema,
  TTable extends keyof TSchema["tables"] & string,
  TReturn,
>(
  query: Query<TSchema, TTable, TReturn>,
  options?: UseQueryOptions,
): ListQueryResult<TReturn> {
  const [data, status] = useQuery(query, options);

  const computedStatus = computeListQueryStatus(status.type, data);

  switch (computedStatus) {
    case "success":
      return {
        status: "success",
        data: data as NonNullable<TReturn>[],
      };
    case "loading":
      return {
        status: "loading",
        data: undefined,
      };
    case "empty":
      return {
        status: "empty",
        data: [],
      };
  }
}

export const computeRecordQueryStatus = function <T>(
  type: StatusType,
  data: T,
) {
  if (type === "unknown") {
    return "loading";
  }
  if (!data) {
    return "not-found";
  }
  return "success";
};

type RecordQueryResult<T> =
  | { status: "success"; data: NonNullable<T> }
  | { status: "not-found"; data: undefined }
  | { status: "loading"; data: undefined };

// not perfect, but does narrow types and infer 'data'
export function useRecordQuery<
  TSchema extends Schema,
  TTable extends keyof TSchema["tables"] & string,
  TReturn,
>(
  query: Query<TSchema, TTable, TReturn>,
  options?: UseQueryOptions,
): RecordQueryResult<TReturn> {
  const [data, status] = useQuery(query, options);

  const computedStatus = computeRecordQueryStatus(status.type, data);

  if (computedStatus === "success") {
    return {
      status: "success",
      data: data as NonNullable<TReturn>,
    };
  } else {
    return {
      status: computedStatus,
      data: undefined,
    };
  }
}
