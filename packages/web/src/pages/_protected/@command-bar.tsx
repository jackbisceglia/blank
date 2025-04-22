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
import { createPreventDefault, fn, keyboard } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { GlobalSearchParams } from "./layout";
import { useGetGroupsList } from "./groups/@data";
import { useAuthentication } from "@/lib/auth.provider";
import { GlobalDialogProps, useDialogFromUrl } from "@/lib/dialog";

// type CommandBarProps = {
//   groups: Group[];
// };

export function GlobalCommandBar<T extends keyof GlobalSearchParams>(
  // props: GlobalDialogProps<T> & CommandBarProps
  props: GlobalDialogProps<T>
) {
  const navigate = useNavigate();
  const { user } = useAuthentication();
  const _groups = useGetGroupsList(user.id);

  const view = useDialogFromUrl({
    search: {
      key: props.searchKey,
      value: props.searchValue,
      valueWhenOpen: "open",
    },
  });

  const commands = {
    home: fn(() => {
      const opts = {
        to: "/",
      };
      return {
        hotkey: "h",
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
      };
      return {
        hotkey: "g",
        title: "groups",
        opts,
        go: () => {
          void navigate(opts);
        },
      };
    }),
    // newExpense: fn(() => {
    //   const opts = {
    //     to: ".",
    //   } as const;
    //   return {
    //     hotkey: "e",
    //     title: "create expense",
    //     opts,
    //     go: () => {
    //       void navigate(opts);
    //     },
    //   };
    // }),
    // TODO: TEMPORARY
    // newGroup: fn(() => {
    //   const opts = {
    //     to: "/groups",
    //     search: {
    //       cmd: undefined,
    //       action: "new-group",
    //     },
    //   } as const;
    //   return {
    //     hotkey: "G",
    //     title: "create group",
    //     opts,
    //     go: () => {
    //       void navigate(opts);
    //     },
    //   };
    // }),
  };

  useEffect(() => {
    const actions = keyboard.register({
      when: view.state() === "open",
      fn: (e) => {
        const keymap = new Map<string, () => void>([
          [commands.home.hotkey, createPreventDefault(commands.home.go, e)],
          [commands.groups.hotkey, createPreventDefault(commands.groups.go, e)],
        ]);

        if (!e.metaKey && !e.ctrlKey) return;
        if (!keymap.has(e.key)) return;

        keymap.get(e.key)?.();
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

  const groups = _groups.data.map((g) => ({
    type: "link",
    title: g.title,
    opts: { to: `/groups/$title`, params: { title: g.title } },
  }));

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
                <span className="text-primary/50">[ctrl+{action.hotkey}]</span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Your Groups">
          {groups.map((group) => (
            <CommandItem
              onSelect={() => {
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
