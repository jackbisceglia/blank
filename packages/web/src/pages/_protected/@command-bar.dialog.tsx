import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEffect } from "react";
import { createPreventDefault, evaluate, keyboard } from "@/lib/utils";
import { Link, LinkOptions, useNavigate } from "@tanstack/react-router";
import { useAuthentication } from "@/lib/authentication";
import * as v from "valibot";
import { createStackableSearchRoute } from "@/lib/search-route";
import { SearchRoute as CreateExpenseRoute } from "./@create-expense.dialog";
import { useGroupListByUserId } from "./@data/groups";

const KEY = "action";
const ENTRY = "command" as const;
export const SearchRoute = createStackableSearchRoute(KEY, ENTRY);
export type SearchRouteSchema = v.InferOutput<typeof SearchRouteSchema>;
export const SearchRouteSchema = v.object({
  [KEY]: v.literal(ENTRY),
});

export function GlobalCommandBar() {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const groups = useGroupListByUserId(auth.user.id);
  const route = SearchRoute.useSearchRoute();
  const createExpenseRoute = CreateExpenseRoute.useSearchRoute();

  type Commands = typeof commands;
  type CommandKeys = keyof typeof commands;

  const commands = {
    home: evaluate(() => {
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
    groups: evaluate(() => {
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
    newExpense: evaluate(() => {
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
          route.close();
          createExpenseRoute.open(true);
        },
      };
    }),
  };

  type GroupCommands = typeof groupCommands;
  const groupCommands = (groups?.data ?? []).map((group, index) => {
    const opts = {
      to: `/groups/$slug_id`,
      params: { slug_id: { slug: group.slug, id: group.id } },
    } as const;

    return {
      hotkey: String(index + 1),
      type: "link",
      title: group.title,
      opts: opts,
      go: () => {
        navigate(opts);
      },
    } as const;
  });

  const values = [
    ...Object.values<Commands[CommandKeys]>(commands),
    ...Object.values<GroupCommands[number]>(groupCommands),
  ];

  const keymap = new Map(values.map((cmd) => [cmd.hotkey, cmd.go]));

  useEffect(() => {
    const actions = keyboard.register({
      when: route.view() === "open",
      fn: (e) => {
        if (!e.metaKey && !e.ctrlKey) return;

        const fn = keymap.get(e.key);

        if (fn) createPreventDefault(fn, e)();
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
  }, [route.state()]);

  return (
    <CommandDialog
      omitCloseButton
      open={route.view() === "open"}
      onOpenChange={route.sync}
    >
      <CommandInput placeholder="type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {Object.values(commands).map((action) => (
            <CommandItem onSelect={action.go} asChild key={action.title}>
              <Link {...action.opts}>
                <span>+</span>
                {action.title}
                <span className="ml-auto text-primary/50">
                  {" "}
                  [ctrl+{action.hotkey}]{" "}
                </span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Your Groups">
          {groupCommands.map((group) => (
            <CommandItem onSelect={group.go} asChild key={group.title}>
              <Link className="lowercase" {...group.opts}>
                <span>@</span>
                {group.title}
                <span className="ml-auto text-primary/50">
                  [ctrl+{group.hotkey}]
                </span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
