import { useRef } from "react";
import { Route } from "../page";
import * as v from "valibot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// config
const TableQuery = {
  query: "query",
} as const;

export const TableQueryKeys = Object.keys(
  TableQuery
) as (keyof typeof TableQuery)[];

export const QuerySchema = v.object({
  [TableQuery.query]: v.optional(v.string()),
} as const);
// end config

export function useQueryFromSearch() {
  const navigate = Route.useNavigate();
  const value = Route.useSearch({
    select: (state) => state[TableQuery.query],
  });

  function set(value: string) {
    void navigate({
      search: (previous) => ({
        ...previous,
        [TableQuery.query]: value.length > 0 ? value : undefined,
      }),
    });
  }

  return { value, set };
}

export function TableQueryInput() {
  const query = useQueryFromSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative max-w-72 w-full">
      <Input
        ref={inputRef}
        className="bg-transparent border border-border hover:bg-secondary/25 py-1 h-min text-xs text-foreground w-full pr-8 pl-2 placeholder:h-min placeholder:text-xs placeholder:p-0 placeholder:m-0 placeholder:text-foreground/40 placeholder:uppercase "
        placeholder="Search expenses..."
        value={query.value ?? ""}
        onChange={(e) => query.set(e.target.value)}
      />
      {query.value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-[4.5px] top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent"
          onClick={(e) => {
            query.set("");
            (e.currentTarget.previousSibling as HTMLInputElement).focus();
          }}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
