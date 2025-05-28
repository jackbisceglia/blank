import { Input } from "@/components/ui/input";
import { SecondaryRow } from "./layout";
import { Button } from "@/components/ui/button";
import { flags } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Route } from "./page";

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
  actions: { deleteAll: () => Promise<void> };
};

function TableActions(props: TableActionsProps) {
  const query = useQueryFromSearch();
  console.log(query.value);

  return (
    <SecondaryRow className="justify-between gap-4 md:gap-1 flex flex-col sm:flex-row sm:items-center">
      <Input
        className="max-w-72 placeholder:lowercase py-0 h-full py-1.5 bg-transparent placeholder:text-secondary-foreground/50 border-border border-1"
        placeholder="Search expenses..."
        value={query.value ?? ""}
        onChange={(e) => {
          query.set(e.target.value);
        }}
      />
      <Button asChild size="xs" variant="theme" className="ml-auto">
        <Link
          to="."
          search={(prev) => ({
            action: ["new-expense", ...(prev.action ?? [])],
          })}
        >
          Create
        </Link>
      </Button>
      {flags.dev.deleteAllExpenses && (
        <Button
          onClick={() => {
            void props.actions.deleteAll();
          }}
          variant="secondary"
          size="xs"
          className="ml-2 "
        >
          DELETE
        </Button>
      )}
    </SecondaryRow>
  );
}

export { TableActions };
