import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";

// TODO: add linkOptions export to the route that can be added to ui based navs

type ViewState = "open" | "closed";

export type UseSearchRoute = {
  open: (value: unknown) => void;
  close: () => void;
  view: () => ViewState;
  state: () => unknown;
};

export type SearchRoute = {
  useSearchRoute: () => UseSearchRoute;
};

export function createSearchRoute(key: string): SearchRoute {
  function useSearchRoute() {
    const navigate = useNavigate();
    const search = useSearch({
      strict: false,
      select: (state) => state[key as keyof typeof state],
      structuralSharing: true,
    });

    function go(k: string, v?: unknown) {
      return void navigate({
        to: ".",
        search: (prev) => ({ ...prev, [key]: v }),
      });
    }

    return {
      open: (value: unknown) => go(key, value),
      close: () => go(key, undefined),
      view: (): ViewState => (!!search ? "open" : "closed"),
      state: () => search,
    };
  }

  return { useSearchRoute };
}

export function createStackableSearchRoute(key: string, value: string) {
  function assertAsArray(search: unknown) {
    if (search && !Array.isArray(search)) {
      throw new Error("Stackable search route requires an array schema");
    }
    return search as string[] | undefined;
  }

  function useSearchRoute() {
    const navigate = useNavigate();
    const search = useSearch({
      strict: false,
      select: (state) => state[key as keyof typeof state],
      structuralSharing: true,
    });

    const stack = assertAsArray(search);

    const go = useCallback(
      (k: string, v?: unknown) => {
        return void navigate({
          to: ".",
          search: (prev: Record<string, unknown>) => {
            return { ...prev, [key]: v };
          },
        });
      },
      [navigate, key]
    );

    const open = (solo?: boolean) => {
      const current = !solo ? (stack ?? []) : [];

      const added = new Set([...current, value]);
      go(key, Array.from(added));
    };

    const close = () => {
      const removed = stack?.filter((v) => v !== value) ?? [];
      go(key, removed.length > 0 ? removed : undefined);
    };

    const view = useCallback((): ViewState => {
      return stack?.includes(value) ? "open" : "closed";
    }, [stack, value]);

    const state = useCallback(() => search, [search]);

    return {
      open,
      close,
      view,
      state,
    };
  }

  return { useSearchRoute };
}
