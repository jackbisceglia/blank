import { QueryClient, useQueryClient } from "@tanstack/react-query";

type KeyDefinition = string;

const keys = {
  authentication: "authentication",
  userPreferences: "userPreferences",
  invites: "invites",
} as const satisfies Record<string, KeyDefinition>;

type Keys = typeof keys;

type KeyLiteral = Keys[keyof Keys];

type KeyFn = typeof key;

type DynamicKey = [KeyLiteral, ...unknown[]];

export function key<T>(key: KeyLiteral, ...params: T[]) {
  return [key, ...params] as DynamicKey;
}

export function invalidateKeys(
  queryClient: QueryClient,
  ...keys: Array<KeyLiteral | DynamicKey>
) {
  return Promise.all(
    keys.map((key) => {
      const queryKey = typeof key === "string" ? [key] : key;

      return queryClient.invalidateQueries({ queryKey });
    }),
  );
}

export function useInvalidate() {
  const queryClient = useQueryClient();

  return function (
    ...keys: KeyLiteral[] | [(key: KeyFn) => ReturnType<KeyFn>]
  ) {
    const transformed = keys.map(function (k) {
      if (typeof k === "function") {
        return k(key);
      }

      return k;
    });

    return invalidateKeys(queryClient, ...transformed);
  };
}
