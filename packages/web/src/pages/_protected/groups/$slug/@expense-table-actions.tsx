import { Input } from "@/components/ui/input";
import { SecondaryRow } from "./layout";
import { Button } from "@/components/ui/button";
import { cn, flags } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Route } from "./page";
import { X } from "lucide-react";
import { useRef } from "react";
import { DeleteAllOptions } from "@/lib/mutators/expense-mutators";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function useQueryFromSearch() {
  const navigate = Route.useNavigate();
  const value = Route.useSearch({
    select: (state) => state.query,
  });

  function set(value: string) {
    void navigate({
      search: (prev) => ({
        ...prev,
        query: value.length > 0 ? value : undefined,
      }),
    });
  }

  return { value, set };
}

type TableActionsProps = {
  id: string;
  actions: {
    deleteAll: (opts: DeleteAllOptions) => Promise<unknown>;
  };
};

function TableActions(props: TableActionsProps) {
  const query = useQueryFromSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <SecondaryRow className="justify-between gap-4 md:gap-2 flex flex-col sm:flex-row sm:items-center mb-3">
      <div className="relative max-w-84 w-full">
        <Input
          ref={inputRef}
          className={cn(
            "bg-accent/50 border-border/50 text-foreground hover:bg-secondary/80  py-1 h-min hover:bg-secondary/25 text-xs border border-border text-foreground w-full pr-8 pl-3",
            `
              placeholder:h-min
              placeholder:text-xs 
              placeholder:p-0 
              placeholder:m-0 
              placeholder:text-foreground/40
              placeholder:uppercase 
            `
              .trim()
              .split("\n")
              .join(" ")
          )}
          placeholder="Search expenses..."
          value={query.value ?? ""}
          onChange={(e) => {
            query.set(e.target.value);
          }}
        />
        {query.value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-[6px] top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent"
            onClick={(e) => {
              query.set("");
              (e.currentTarget.previousSibling as HTMLInputElement).focus();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Button asChild size="xs" variant="theme" className="ml-auto w-20">
        <Link
          to="."
          search={(prev) => ({
            action: ["new-expense", ...(prev.action ?? [])],
          })}
        >
          Create
        </Link>
      </Button>
      <Button asChild size="xs" variant="destructive" disabled className="w-20">
        <Link
          to="."
          search={(prev) => ({
            action: ["new-expense", ...(prev.action ?? [])],
          })}
        >
          Delete
        </Link>
      </Button>

      <Select defaultValue="active">
        <SelectTrigger className="text-xs uppercase bg-accent/50 border-border/50 border text-foreground hover:bg-secondary/80 placeholder:text-muted-foreground/60 h-min w-28 py-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="uppercase">
          <SelectItem className="text-xs" value="all">
            All
          </SelectItem>
          <SelectItem className="text-xs" value="active">
            Active
          </SelectItem>
          <SelectItem className="text-xs" value="settled">
            Settled
          </SelectItem>
        </SelectContent>
      </Select>
      {flags.dev.deleteAllExpenses && (
        <Button
          onClick={() => {
            void props.actions.deleteAll({ groupId: props.id });
          }}
          variant="secondary"
          size="xs"
          className="ml-2 border-border border bg-secondary/50"
        >
          DELETE
        </Button>
      )}
    </SecondaryRow>
  );
}

export { TableActions };
