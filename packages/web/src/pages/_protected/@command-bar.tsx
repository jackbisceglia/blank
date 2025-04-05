import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEffect } from "react";
// import { Route } from "./layout";
import { keyboard } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { GlobalSearchParams } from "./layout";
import * as v from "valibot";

type CommandParam = v.InferOutput<typeof GlobalSearchParams.entries.cmd>;

function useCommandViewFromUrl(searchParamKey: CommandParam) {
  type State = "open" | "closed";

  const navigate = useNavigate();

  const setViewState = (state: State) => {
    void navigate({
      to: ".",
      search: { cmd: state === "open" ? state : undefined },
    });
  };

  return {
    state: () => (searchParamKey === "open" ? "open" : "closed"),
    open: () => {
      setViewState("open");
    },
    close: () => {
      setViewState("closed");
    },
  };
}

const fn = <T,>(fn: () => T): T => fn();

type GlobalCommandBarProps = {
  searchParamKey: CommandParam;
};

export function GlobalCommandBar(props: GlobalCommandBarProps) {
  const navigate = useNavigate();
  const view = useCommandViewFromUrl(props.searchParamKey);

  const commands = {
    home: fn(() => {
      const opts = {
        to: "/",
        // search: { cmd: undefined, action: undefined }
      };
      return {
        title: "home",
        opts,
        go: () => {
          void navigate(opts);
        },
      };
    }),
    groups: fn(() => {
      const opts = {
        to: "/groups",
        // search: { cmd: undefined, action: undefined },
      };
      return {
        title: "groups",
        opts,
        go: () => {
          void navigate(opts);
        },
      };
    }),
    newExpense: fn(() => {
      const opts = {
        to: ".",
        // search: { cmd: undefined, action: "new-expense" },
      } as const;
      return {
        title: "create expense",
        opts,
        go: () => {
          void navigate(opts);
        },
      };
    }),
  };

  useEffect(() => {
    const actions = keyboard.register({
      when: view.state() === "open",
      fn: (e) => {
        if (!e.metaKey && !e.ctrlKey) return;
        if (view.state() === "closed") return;
        e.preventDefault();

        switch (e.key) {
          case "h":
            commands.home.go();
            break;
          case "g":
            commands.groups.go();
            break;
        }
      },
    });

    const cmdk = keyboard.register({
      fn: (e) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          view.open();
        }
      },
    });

    return () => {
      actions.cleanup();
      cmdk.cleanup();
    };
  }, [view.state]);

  const groups = [
    { type: "link", title: "la familia", opts: { to: "/groups/la-familia" } },
    {
      type: "link",
      title: "the apartment",
      opts: { to: "/groups/the-aprtment" },
    },
    { type: "link", title: "homies", opts: { to: "/groups/homies" } },
  ];

  return (
    <CommandDialog
      open={view.state() === "open"}
      onOpenChange={(bool) => {
        (bool ? view.open : view.close)();
      }}
    >
      <CommandInput placeholder="type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {Object.values(commands).map((action) => (
            <CommandItem
              onSelect={() => {
                action.go();
              }}
              asChild
              key={action.title}
            >
              <Link {...action.opts}>
                <span>+</span>
                <span className="mr-auto">{action.title}</span>
                <span className="text-primary/50">
                  [{action.title.at(0)?.toUpperCase()}]
                </span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Group Pages">
          {groups.map((group) => (
            <CommandItem
              onSelect={() => {
                console.log(group);
                void navigate(group.opts);
              }}
              asChild
              key={group.title}
            >
              <Link {...group.opts}>
                <span>@</span>
                <span>{group.title}</span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
