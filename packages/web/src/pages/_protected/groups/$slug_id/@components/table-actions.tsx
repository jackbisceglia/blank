import { SecondaryRow } from "../layout";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { DeleteAllOptions } from "@/lib/client-mutators/expense-mutators";
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import { withToast } from "@/lib/toast";
import { flags } from "@/lib/utils";
import { Member } from "@blank/zero";
import {
  TableFilterBadgeRow,
  TableFilterButton,
  TableFiltersDropdown,
} from "./table-filters";
import { TableQueryInput } from "./table-query";
import { TableStatusSelect } from "./table-status";

function useConfirmDeleteAllExpenses(
  groupId: string,
  deleteAllMutation: (opts: DeleteAllOptions) => Promise<unknown>,
  leave: () => void,
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

type TableActionsProps = {
  id: string;
  members: Member[];
  expenseCount: number;
  actions: {
    deleteAll: (opts: DeleteAllOptions) => Promise<unknown>;
  };
};

function TableActions(props: TableActionsProps) {
  const deleteAll = useConfirmDeleteAllExpenses(
    props.id,
    props.actions.deleteAll,
    () => {},
  );

  return (
    <>
      <deleteAll.dialog />
      <SecondaryRow className="justify-between gap-4 md:gap-2 flex flex-col sm:flex-row sm:items-center mb-2.5">
        <TableQueryInput />
        <TableFiltersDropdown members={props.members}>
          <TableFilterButton />
        </TableFiltersDropdown>
        <Button asChild size="xs" variant="theme" className="ml-auto w-24">
          <Link
            to="."
            search={(prev) => ({
              ...prev,
              action: ["new-expense", ...(prev.action ?? [])],
            })}
          >
            Create
          </Link>
        </Button>
        {flags.dev.deleteAllExpenses && (
          <Button
            onClick={deleteAll.confirm}
            size="xs"
            variant="destructive"
            disabled={props.expenseCount === 0}
            className="w-28"
          >
            Delete All
          </Button>
        )}
        <TableStatusSelect />
      </SecondaryRow>
      <TableFilterBadgeRow />
    </>
  );
}

export { TableActions };
