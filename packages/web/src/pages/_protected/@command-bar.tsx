import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEffect } from "react";
import { createPreventDefault, fn, keyboard } from "@/lib/utils";
import { Link, LinkOptions, useNavigate } from "@tanstack/react-router";
import { useGetGroupsList } from "./groups/@data";
import { useAuthentication } from "@/lib/auth.provider";
import * as v from "valibot";
import { createStackableSearchRoute } from "@/lib/create-search-route";

const ENTRY = "command" as const;
export const SearchRoute = createStackableSearchRoute("action", ENTRY);
export type SearchRouteSchema = v.InferOutput<typeof SearchRouteSchema>;
export const SearchRouteSchema = v.object({
  action: v.literal(ENTRY),
});

export function GlobalCommandBar() {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const groups = useGetGroupsList(auth.user.id);
  const route = SearchRoute.useSearchRoute();

  const commands = {
    home: fn(() => {
      const opts = {
        to: "/",
      } as const;
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
      } as const;
      return {
        hotkey: "g",
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
        search: (previous) => ({
          ...previous,
          action: ["new-expense"],
        }),
      } satisfies LinkOptions;

      return {
        hotkey: "e",
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
      when: route.view() === "open",
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
          route.open();
        }
      },
    });

    return () => {
      actions.cleanup();
      cmdk.cleanup();
    };
  }, [route.state]);

  const groupCommands = groups.data.map(
    (group) =>
      ({
        type: "link",
        title: group.title,
        opts: { to: `/groups/$slug`, params: { slug: group.slug } },
      }) as const
  );

  return (
    <CommandDialog
      open={route.view() === "open"}
      onOpenChange={(bool) => {
        (bool ? route.open : route.close)();
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
          {groupCommands.map((group) => (
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
