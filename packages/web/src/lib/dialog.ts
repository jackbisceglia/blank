import { GlobalSearchParams } from "@/pages/_protected/layout";
import { useNavigate } from "@tanstack/react-router";

export type GlobalDialogProps<T extends keyof GlobalSearchParams> = {
  searchKey: T;
  searchValue: GlobalSearchParams[T];
};

type useDialogOptions = {
  search: {
    key: string;
    value: string | undefined;
    valueWhenOpen: string;
  };
};

export function useDialogFromUrl(opts: useDialogOptions) {
  type State = "open" | "closed";

  const navigate = useNavigate();

  const setViewState = (state: State) => {
    void navigate({
      to: ".",
      search: {
        [opts.search.key]:
          state === "open" ? opts.search.valueWhenOpen : undefined,
      },
    });
  };

  return {
    state: () =>
      opts.search.value === opts.search.valueWhenOpen ? "open" : "closed",
    open: () => {
      setViewState("open");
    },
    close: () => {
      setViewState("closed");
    },
  };
}
