import * as v from "valibot";
import { Route } from "../page";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { PropsWithChildren } from "react";
import { Member } from "@blank/zero";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SecondaryRow } from "../layout";

// config
const TableFilters = {
  paidBy: "paidBy",
  with: "with",
} as const;

export const TableFiltersKeys = Object.keys(
  TableFilters
) as (keyof typeof TableFilters)[];

export const FiltersSchema = v.object({
  [TableFilters.paidBy]: v.pipe(v.optional(v.array(v.string()))),
  [TableFilters.with]: v.optional(v.array(v.string())),
} as const);
// end config

export function toFilterDisplay(key: keyof typeof TableFilters) {
  const display = {
    [TableFilters.paidBy]: "Paid",
    [TableFilters.with]: "With",
  };

  return display[key];
}

export function useFiltersFromSearch() {
  const navigate = Route.useNavigate();
  const value = Route.useSearch({
    select(state) {
      return {
        paidBy: state[TableFilters.paidBy],
        with: state[TableFilters.with],
      };
    },
  });

  type Filters = keyof NonNullable<typeof value>;
  type ValuesByFilter = NonNullable<typeof value>[keyof NonNullable<
    typeof value
  >];

  type FilterEntries = typeof value extends undefined
    ? []
    : Array<[Filters, ValuesByFilter]>;

  const deduplicate = (array: string[]) => Array.from(new Set(array));
  const dropEmpty = (array: string[]) => (array.length > 0 ? array : undefined);
  const normalize = (array: string[]) => dropEmpty(deduplicate(array));

  function toggle(filter: Filters, newValue: string) {
    const current = value[filter] ?? [];

    const toggled = current.includes(newValue)
      ? current.filter((v) => v !== newValue)
      : [...current, newValue];

    void navigate({
      search: (previous) => ({
        ...previous,
        [filter]: normalize(toggled),
      }),
    });
  }

  function clear() {
    void navigate({
      search: (previous) =>
        Object.keys(value).reduce(
          (acc, curr) => ({
            ...acc,
            [curr]: undefined, // todo: check if this is correct
          }),
          { ...previous }
        ),
    });
  }

  const entries: FilterEntries = Object.entries(value).filter(
    ([, list]) => list && list.length > 0
  ) as Array<[keyof typeof value, (typeof value)[keyof typeof value]]>;

  return { value, entries, toggle, clear };
}

export function TableFilterButton() {
  return (
    <DropdownMenuTrigger asChild>
      <Button
        size="xs"
        className="w-24 bg-transparent border border-border py-1.5 pl-3 pr-2 hover:bg-secondary/25 text-foreground h-min "
      >
        <Plus className="size-2.5" />
        Filter
      </Button>
    </DropdownMenuTrigger>
  );
}

type FilterDropdownProps = PropsWithChildren<{
  members: Member[];
}>;

export function TableFiltersDropdown(props: FilterDropdownProps) {
  const filter = useFiltersFromSearch();

  return (
    <DropdownMenu>
      {props.children}
      <DropdownMenuContent className="w-40" align="start">
        <DropdownMenuLabel className="text-xs uppercase font-medium">
          Filters
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {TableFiltersKeys.map((category) => (
            <DropdownMenuSub key={category}>
              <DropdownMenuSubTrigger className="text-xs uppercase font-medium">
                {toFilterDisplay(category)}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {props.members.map((m) => (
                    <DropdownMenuCheckboxItem
                      className="max-w-48"
                      key={`${category}-${m.nickname}`}
                      checked={
                        filter.value[category]?.includes(m.nickname) ?? false
                      }
                      onCheckedChange={() =>
                        filter.toggle(category, m.nickname)
                      }
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                    >
                      {m.nickname}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableFilterBadgeRow() {
  const filters = useFiltersFromSearch();

  if (filters.entries.length === 0) return null;

  return (
    <SecondaryRow className="justify-between gap-4 md:gap-2 flex flex-col sm:flex-row sm:items-center my-1.5 animate-in slide-in-from-top-0.5 fade-in duration-300">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground uppercase font-medium">
          Filters:
        </span>
        {filters.entries.map(([category, values]) =>
          values?.map((filter) => (
            <Badge
              key={`${category}-${filter}`}
              className="lowercase py-0 gap-1.5 pl-2 !pr-0 border border-foreground/40 bg-secondary text-foreground/80 text-xs font-medium max-w-48"
            >
              <span className="truncate">
                {toFilterDisplay(category)}: {String(filter)}
              </span>
              <Button
                onClick={() => filters.toggle(category, filter)}
                variant="ghost"
                size="icon"
                className="h-min hover:bg-transparent py-[0.25rem] px-1 "
              >
                <X className="size-4" />
              </Button>
            </Badge>
          ))
        )}
      </div>
      <Button
        onClick={() => filters.clear()}
        variant="ghost"
        size="xs"
        className="text-xs text-foreground/60 hover:text-foreground"
      >
        Clear
      </Button>
    </SecondaryRow>
  );
}
