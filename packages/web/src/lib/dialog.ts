import { SearchParamActionValues } from "@/pages/_protected/@search-params";
import { useNavigate, useSearch } from "@tanstack/react-router";
import * as v from "valibot";

type State = "open" | "closed";

export type DialogFromUrlProps<T extends object = object> = T & {
  searchValue: string[] | undefined;
};

export function createActionSchema(literal: string) {
  return v.object({
    action: v.literal(literal),
  });
}

export function addDialogSearchParam<T>(previous: T[], literal: string) {
  return [...new Set([...previous, literal])] as T[];
}

export function removeDialogSearchParam<T>(previous: T[], literal: string) {
  const filtered = previous.filter((action) => action !== literal);

  return filtered.length ? filtered : undefined;
}

type useDialogOptions = {
  schema: ReturnType<typeof createActionSchema>;
};

export function useDialogFromUrl(opts: useDialogOptions) {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  const literal = opts.schema.entries.action.literal as SearchParamActionValues;

  const setViewState = (state: State) => {
    void navigate({
      to: ".",
      search: (prev) => {
        const actions = [...(prev.action ?? [])];

        const actionValues =
          state === "open"
            ? addDialogSearchParam(actions, literal)
            : removeDialogSearchParam(actions, literal);

        return {
          ...prev,
          action: actionValues,
        };
      },
    });
  };

  return {
    state: () => (search.action?.includes(literal) ? "open" : "closed"),
    open: () => {
      setViewState("open");
    },
    close: () => {
      setViewState("closed");
    },
  };
}
