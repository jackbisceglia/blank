import { Badge } from "@/components/ui/badge";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  Row,
  Column,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComponentProps, PropsWithChildren, useRef, useMemo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ExpenseWithParticipants } from "../page";
import {
  getPayerFromParticipants,
  ParticipantWithMember,
} from "@/lib/participants";
import { tableNavigationContext } from "@/lib/keyboard-nav";
import { cn, flags } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ParticipantBadge, ParticipantBadgeList } from "./table-badges";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useQueryFromSearch } from "./table-query";
import { useFiltersFromSearch } from "./table-filters";
import { Status, useStatusFromSearch } from "./table-status";

type Payer = ParticipantWithMember | undefined;

const createGetPayer =
  (colId: string) =>
  (row: Row<ExpenseWithParticipants>): Payer =>
    row.getValue(colId);

type SortButtonProps = PropsWithChildren<{
  column: Column<ExpenseWithParticipants>;
  rows: Row<ExpenseWithParticipants>[];
  onClick?: ComponentProps<typeof Button>["onClick"];
}>;

const SortButton = (props: SortButtonProps) => {
  const sort = {
    asc: "ascending",
    desc: "descending",
    none: "none",
  } as const;

  // NOTE: this is super ugly, but an edge case check:
  // tldr; if we are dealing with the date column, we want to check if the data is 'naturally' sorted
  // this means, if the table is tracking the sort state as false (not sorted), then we want to know if it's still actually sorted by way of the query itself
  // when this is the case, we just pretend to the user that it's sorted, as it's indistinguishable from the table state in this case
  // this essentially disallows an 'unsorted' state for the date column and provides a nice fallback for when nothing is explicitly sorted
  const [direction, toggle] = (() => {
    const baseIsSorted = props.column.getIsSorted();
    const baseToggle = props.column.toggleSorting;

    if (props.column.id === "date") {
      const isCaseSortedOutsideOfTableState = props.rows.reduce(
        (acc, row, index) => {
          if (index === 0) return acc;

          const isDesc =
            new Date(row.original.date) <=
            new Date(props.rows[index - 1].original.date);

          return acc && isDesc;
        },
        true,
      );

      const isSortedWithManualCheck = isCaseSortedOutsideOfTableState
        ? "desc"
        : baseIsSorted;

      return [
        sort[isSortedWithManualCheck || "none"],
        isCaseSortedOutsideOfTableState ? () => baseToggle(false) : baseToggle,
      ] as const;
    }

    return [sort[baseIsSorted || "none"], baseToggle] as const;
  })();

  return (
    <Button
      onClick={props.onClick ?? (() => toggle())}
      data-sort={direction}
      size="xs"
      variant="ghost"
      className={cn(
        "gap-1.5 font-normal hover:bg-transparent uppercase !pl-2 !pr-4 lg:!pr-4 lg:!pl-2 sm:px-0 py-1 h-full cursor-pointer w-full mr-auto flex justify-start items-center ",
      )}
      aria-sort={direction}
    >
      {props.children}

      {direction === "ascending" && <ChevronUp className="size-3.5" />}
      {direction === "descending" && <ChevronDown className="size-3.5" />}
      {direction === "none" && <div aria-hidden className="size-3.5" />}
    </Button>
  );
};

const columnHelper = createColumnHelper<ExpenseWithParticipants>();

const columns = [
  columnHelper.accessor("amount", {
    sortingFn: "basic",
    header: (props) => (
      <SortButton column={props.column} rows={props.table.getRowModel().rows}>
        Cost
      </SortButton>
    ),
    cell: (opts) => `$${opts.getValue().toString()}`,
  }),
  columnHelper.accessor("description", {
    sortingFn: "alphanumeric",
    filterFn: "includesString",
    header: (props) => (
      <SortButton column={props.column} rows={props.table.getRowModel().rows}>
        Description
      </SortButton>
    ),
    cell: (opts) => {
      const RANGE = 1000 * 60;

      const isNew =
        (opts.row.original.createdAt ?? Number.NEGATIVE_INFINITY) >
        Date.now() - RANGE;

      return (
        <p className="text-foreground font-medium lowercase w-full h-full flex gap-2">
          {isNew && (
            <Badge
              className="bg-teal-400/90 uppercase text-[9px] px-1 py-0 my-auto"
              variant="theme"
            >
              New
            </Badge>
          )}
          {opts.getValue().toString()}
        </p>
      );
    },
  }),
  columnHelper.accessor((row) => getPayerFromParticipants(row.participants), {
    id: "paid-by",
    filterFn: (row, colId, values: string[]) => {
      if (values.length === 0) return true;

      const nickname = createGetPayer(colId)(row)?.member?.nickname ?? "";
      return values.includes(nickname);
    },
    sortingFn: (rowA, rowB, colId: string) => {
      const payer = createGetPayer(colId);
      const nickname = (row: Row<ExpenseWithParticipants>) =>
        payer(row)?.member?.nickname.toLowerCase() ?? "";

      return nickname(rowA).localeCompare(nickname(rowB));
    },
    header: (props) => (
      <SortButton column={props.column} rows={props.table.getRowModel().rows}>
        Paid By
      </SortButton>
    ),
    cell: (opts) => {
      const payer = opts.getValue();

      if (!payer) return null;

      return <ParticipantBadge participant={payer} strategy="standard" />;
    },
  }),
  columnHelper.accessor(
    (row) => row.participants.filter((p) => p.role === "participant"),
    {
      id: "with",
      header: "With",
      filterFn: (row, colId, values: string[]) => {
        if (values.length === 0) return true;

        const participants: ParticipantWithMember[] = row.getValue(colId);

        const nickname = (p: ParticipantWithMember) => p.member?.nickname ?? "";

        return values.some((value) =>
          participants.some((p) => nickname(p).includes(value)),
        );
      },
      cell: (opts) => {
        const participants = opts.getValue();

        if (participants.length === 0) {
          return <p className="text-muted-foreground lowercase">None</p>;
        }

        return <ParticipantBadgeList participants={participants} />;
      },
    },
  ),
  columnHelper.accessor("date", {
    sortingFn: "datetime",
    sortDescFirst: false,
    header: (props) => {
      return (
        <SortButton column={props.column} rows={props.table.getRowModel().rows}>
          Date
        </SortButton>
      );
    },
    cell: (opts) =>
      new Date(opts.getValue())
        .toLocaleDateString()
        .split("/")
        .map((part, index) =>
          index === 2 ? [part.at(-2), part.at(-1)].join("") : part,
        )
        .join("/"),
  }),
  columnHelper.display({
    id: "manage",
    cell: (props) => (
      <div className="flex gap-2">
        <Button
          onClick={() => props.table.options.meta?.expand(props.row.id)}
          size="xs"
          variant="outline"
          className="uppercase py-1 px-3.5 border-border"
        >
          Manage
        </Button>

        {flags.dev.inlineRandomizeExpense && (
          <Button
            onClick={() => props.table.options.meta?.updateTitle(props.row.id)}
            size="xs"
            variant="outline"
            className="uppercase py-1 px-3.5 border-border"
          >
            Update Random
          </Button>
        )}
      </div>
    ),
  }),
];

type DataTableProps = {
  expand: (id: string) => void;
  updateTitle: (id: string) => void;
  data: ExpenseWithParticipants[];
  totalGroupExpenses: number;
  query: string | undefined;
};

const useColumnFilters = () => {
  const query = useQueryFromSearch();
  const filters = useFiltersFromSearch();

  return useMemo(
    () => [
      {
        id: "description",
        value: query.value ?? "",
      },
      {
        id: "paid-by",
        value: filters.value.paidBy ?? "",
      },
      {
        id: "with",
        value: filters.value.with ?? "",
      },
    ],
    [query.value, filters.value],
  );
};

type EmptyStateProps = {
  totalCount: number;
  status: Status;
};

function EmptyState(props: EmptyStateProps) {
  const CreateExpenseLink = (props: PropsWithChildren) => {
    return (
      <Link
        to="."
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-blank-theme-text",
        )}
        search={(prev) => ({
          action: ["new-expense", ...(prev.action ?? [])],
        })}
      >
        {props.children}
      </Link>
    );
  };

  // no matter what, if there are no expenses, we want to show the "create an expense" link
  if (props.totalCount === 0) {
    return (
      <p className="text-muted-foreground">
        No expenses yet,{" "}
        <CreateExpenseLink>create an expense</CreateExpenseLink> to get started.
      </p>
    );
  }

  switch (props.status) {
    case "all":
    case "active":
      return (
        <p className="text-muted-foreground">
          No expenses yet,{" "}
          <CreateExpenseLink>create an expense</CreateExpenseLink> to get
          started.
        </p>
      );
    case "settled":
      return <p>No expenses settled.</p>;
    default:
      throw new Error(`Invalid Empty State`);
  }
}

export function DataTable(props: DataTableProps) {
  const status = useStatusFromSearch();
  const columnFilters = useColumnFilters();

  const initialState = useMemo(
    () => ({ sorting: [{ id: "date", desc: true }] }),
    [],
  );

  const table = useReactTable({
    columns,
    data: props.data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters: columnFilters },
    initialState,
    meta: { expand: props.expand, updateTitle: props.updateTitle },
    getRowId: (row) => row.id,
  });

  const rowRefs = useRef<HTMLTableRowElement[]>([]);

  return (
    <Table className="text-sm mb-2">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  className="min-w-fit w-fit max-w-fit"
                  data-state={header.id}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            return (
              <TableRow
                ref={(el) => {
                  if (!el) return;
                  rowRefs.current[row.index] = el;
                }}
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "hover:bg-muted focus-within:bg-muted transition-colors",
                  row.original.status === "settled" && "opacity-55",
                )}
                tabIndex={0}
                onKeyDown={(e) => {
                  const navigation = tableNavigationContext(e);

                  if (!navigation) return;
                  e.preventDefault();

                  const currentRow = () => e.currentTarget;
                  const tbody = () => e.currentTarget.parentElement;

                  const sibling = (() => {
                    switch (navigation.direction) {
                      case "up":
                        return (
                          currentRow().previousElementSibling ??
                          tbody()?.lastElementChild
                        );
                      case "down":
                        return (
                          currentRow().nextElementSibling ??
                          tbody()?.firstElementChild
                        );
                    }
                  })() as HTMLTableRowElement | null;

                  if (sibling?.tagName === "TR") {
                    sibling.focus();
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    // some custom rules to make these columns more tied to the table structure
                    className={cn(
                      // GENERAL
                      "min-w-fit w-fit max-w-fit",

                      // COST
                      "[&:first-child]:min-w-fit [&:first-child]:w-auto",

                      // DESCRIPTION
                      "[&:nth-child(2)]:w-auto [&:nth-child(2)]:min-w-fit [&:nth-child(2)]:whitespace-nowrap",

                      // PAID BY
                      "[&:nth-child(3)]:min-w-min [&:nth-child(3)]:w-min [&:nth-child(3)]:max-w-20 [&:nth-child(3)]:truncate",

                      // PAID BY LARGE
                      "xl:[&:nth-child(3)]:min-w-min xl:[&:nth-child(3)]:w-min xl:[&:nth-child(3)]:max-w-40 xl:[&:nth-child(3)]:truncate",

                      // WITH
                      "[&:nth-child(4)]:min-w-fit [&:nth-child(4)]:w-fit [&:nth-child(4)]:max-w-36 [&:nth-child(4)]:truncate",

                      // WITH LARGE
                      "lg:[&:nth-child(4)]:min-w-min lg:[&:nth-child(4)]:w-min lg:[&:nth-child(4)]:max-w-44 lg:[&:nth-child(4)]:truncate",

                      // MANAGE
                      "[&:last-child]:px-4",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow className="focus-within:outline-none">
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center uppercase"
            >
              <EmptyState
                totalCount={props.totalGroupExpenses}
                status={status.value}
              />
              {/* {props.data.length === 0 ? (
              ) : (
                "No results found."
              )} */}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
