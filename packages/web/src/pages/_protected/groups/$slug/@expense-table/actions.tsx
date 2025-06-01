import { Input } from "@/components/ui/input";
import { SecondaryRow } from "../layout";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Route } from "../page";
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
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import { withToast } from "@/lib/toast";

function useConfirmDeleteAllExpenses(
  groupId: string,
  deleteAllMutation: (opts: DeleteAllOptions) => Promise<unknown>,
  leave: () => void
) {
  return useWithConfirmation({
    title: "Delete all expenses?",
    description: { type: "default", entity: "expenses" },
    onConfirm: async () => {
      return withToast({
        promise: () => {
          return deleteAllMutation({ groupId });
        },
        notify: {
          loading: "deleting all expenses...",
          success: "Expenses deleted successfully",
          error: "Unable to delete all expenses",
        },
        classNames: {
          success: "!bg-secondary !border-border",
        },
      }).then(() => leave());
    },
  });
}

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
  expenseCount: number;
  actions: {
    deleteAll: (opts: DeleteAllOptions) => Promise<unknown>;
  };
};

function TableActions(props: TableActionsProps) {
  const query = useQueryFromSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteAll = useConfirmDeleteAllExpenses(
    props.id,
    props.actions.deleteAll,
    () => {}
  );

  return (
    <>
      <deleteAll.dialog />
      <SecondaryRow className="justify-between gap-4 md:gap-2 flex flex-col sm:flex-row sm:items-center mb-3">
        <div className="relative max-w-84 w-full">
          <Input
            ref={inputRef}
            className="bg-transparent border border-border hover:bg-secondary/80  py-1 h-min hover:bg-secondary/25 text-xs text-foreground w-full pr-8 pl-3 placeholder:h-min placeholder:text-xs placeholder:p-0 placeholder:m-0 placeholder:text-foreground/40 placeholder:uppercase "
            placeholder="Search expenses..."
            value={query.value ?? ""}
            onChange={(e) => query.set(e.target.value)}
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

        <Button asChild size="xs" variant="theme" className="ml-auto w-28">
          <Link
            to="."
            search={(prev) => ({
              action: ["new-expense", ...(prev.action ?? [])],
            })}
          >
            Create
          </Link>
        </Button>
        <Button
          onClick={deleteAll.confirm}
          size="xs"
          variant="destructive"
          disabled={props.expenseCount === 0}
          className="w-28"
        >
          Delete All
        </Button>

        <Select defaultValue="active">
          <SelectTrigger className="text-xs uppercase w-28 bg-transparent border border-border hover:bg-secondary/80 py-1.5 pl-3 pr-2 hover:bg-secondary/25 text-foreground h-min ">
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
      </SecondaryRow>
    </>
  );
}

export { TableActions };
