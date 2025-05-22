import { useNavigate, useSearch } from "@tanstack/react-router";

// TODO: add linkOptions export to the route that can be added to ui based navs

type ViewState = "open" | "closed";

export function createSearchRoute(key: string) {
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

    function go(k: string, v?: unknown) {
      return void navigate({
        to: ".",
        search: (prev) => ({ ...prev, [key]: v }),
      });
    }

    return {
      open: () => {
        const added = new Set([...(stack ?? []), value]);

        go(key, Array.from(added));
      },
      close: () => {
        const removed = stack?.filter((v) => v !== value) ?? [];

        go(key, removed.length > 0 ? removed : undefined);
      },
      view: (): ViewState => {
        console.log(stack, value);
        return stack?.includes(value) ? "open" : "closed";
      },
      state: () => search,
    };
  }

  return { useSearchRoute };
}
