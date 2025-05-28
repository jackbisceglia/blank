import { Badge } from "@/components/ui/badge";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import React from "react";
import { ExpenseWithParticipants } from "./page";
import { tableNavigationContext } from "@/lib/keyboard-nav";
import { flags } from "@/lib/utils";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type BadgeSimpleProps = React.PropsWithChildren<{
  variant: "secondary" | "theme";
}> &
  React.ComponentPropsWithoutRef<"span">;

const BadgeSimple = React.forwardRef<HTMLSpanElement, BadgeSimpleProps>(
  ({ variant, children, ...rest }, ref) => (
    <Badge
      ref={ref}
      className="overflow-x-hidden truncate block max-w-full"
      variant={variant}
      {...rest}
    >
      {children}
    </Badge>
  )
);

BadgeSimple.displayName = "BadgeSimple";

type ParticipantBadgeProps = {
  participant: ExpenseWithParticipants["participants"][number];
  strategy?: "compact" | "standard";
};
function ParticipantBadge(props: ParticipantBadgeProps) {
  const p = props.participant;
  const variant = p.role === "participant" ? "secondary" : "theme";

  switch (props.strategy) {
    case "compact":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <BadgeSimple variant={variant} className="cursor-pointer">
              {getInitials(p.member?.nickname)}
            </BadgeSimple>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            <p className="font-semibold">{p.member?.nickname || "?"}</p>
          </TooltipContent>
        </Tooltip>
      );
    case "standard":
      return <BadgeSimple variant={variant}>{p.member?.nickname}</BadgeSimple>;
  }
}

type ParticipantBadgeListProps = {
  participants: ExpenseWithParticipants["participants"];
};
function ParticipantBadgeList(props: ParticipantBadgeListProps) {
  const participants = props.participants.filter(
    (p): p is typeof p & { member: NonNullable<typeof p.member> } =>
      p.member !== undefined
  );

  if (participants.length !== props.participants.length) return null;

  return (
    <ul className="space-x-1 w-fit">
      {participants.map((p) => (
        <li key={p.userId}>
          <ParticipantBadge participant={p} strategy="compact" />
        </li>
      ))}
    </ul>
  );
}

const columnHelper = createColumnHelper<ExpenseWithParticipants>();

const columns = [
  columnHelper.accessor("amount", {
    header: "Cost",
    cell: (opts) => `$${opts.getValue().toString()}`,
  }),
  columnHelper.accessor("description", {
    cell: (opts) => {
      const NEG_INF = Number.NEGATIVE_INFINITY;
      const RANGE = 1000 * 60;

      const NewBadge = () =>
        (opts.row.original.createdAt ?? NEG_INF) > Date.now() - RANGE && (
          <Badge
            className="bg-teal-400/90 uppercase text-[9px] px-1 py-0 my-auto"
            variant="theme"
          >
            New
          </Badge>
        );

      return (
        <>
          <p className="text-foreground font-medium lowercase w-full h-full flex gap-2">
            <NewBadge />
            {opts.getValue().toString()}
          </p>
        </>
      );
    },
  }),
  columnHelper.accessor("participants", {
    id: "paid-by",
    header: "Paid By",
    cell: (opts) => {
      const payer = opts.getValue().find((p) => p.role === "payer");

      return payer ? (
        <ParticipantBadge participant={payer} strategy="standard" />
      ) : null;
    },
  }),
  columnHelper.accessor("participants", {
    cell: (opts) => {
      const participants = opts
        .getValue()
        .filter((p) => p.role === "participant");

      return participants.length > 0 ? (
        <ParticipantBadgeList participants={participants} />
      ) : (
        <p className="text-muted-foreground lowercase">None</p>
      );
    },
  }),
  columnHelper.accessor("date", {
    cell: (opts) =>
      new Date(opts.getValue())
        .toLocaleDateString()
        .split("/")
        .map((part, index) =>
          index === 2 ? [part.at(-2), part.at(-1)].join("") : part
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
    size: 32,
  }),
];

type DataTableProps = {
  expand: (id: string) => void;
  updateTitle: (id: string) => void;
  data: ExpenseWithParticipants[];
  query: string | undefined;
};

export function DataTable(props: DataTableProps) {
  const data = useMemo(() => {
    const query = props.query?.trim().toLowerCase();

    if (!query) {
      return props.data;
    } else {
      return props.data.filter((expense) =>
        expense.description.toLowerCase().includes(query)
      );
    }
  }, [props.data, props.query]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: {
      expand: props.expand,
      updateTitle: props.updateTitle,
    },
  });

  const rowRefs = useRef<HTMLTableRowElement[]>([]);

  return (
    <Table className="text-sm">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  className={`min-w-fit w-fit max-w-fit`}
                  data-state={header.id}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
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
                // onClick={select}
                className="hover:bg-blank-theme-background/25 transition-colors"
                // role="checkbox"
                // aria-checked={row.getIsSelected()}
                tabIndex={0}
                onKeyDown={(e) => {
                  const navigation = tableNavigationContext(e);
                  if (navigation) {
                    e.preventDefault();
                    const delta = navigation.direction === "up" ? -1 : 1;

                    rowRefs.current
                      .at((row.index + delta) % rowRefs.current.length)
                      ?.focus();
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`
                        min-w-fit w-fit max-w-fit
                        
                        [&:first-child]:min-w-fit [&:first-child]:w-auto 
                        
                        [&:nth-child(2)]:w-auto [&:nth-child(2)]:min-w-fit [&:nth-child(2)]:whitespace-nowrap 

                        [&:nth-child(3)]:min-w-min [&:nth-child(3)]:w-min [&:nth-child(3)]:max-w-20 [&:nth-child(3)]:truncate
                        xl:[&:nth-child(3)]:min-w-min xl:[&:nth-child(3)]:w-min xl:[&:nth-child(3)]:max-w-40 xl:[&:nth-child(3)]:truncate

                        [&:nth-child(4)]:min-w-fit [&:nth-child(4)]:w-fit [&:nth-child(4)]:max-w-36 [&:nth-child(4)]:truncate

                        lg:[&:nth-child(4)]:min-w-min lg:[&:nth-child(4)]:w-min lg:[&:nth-child(4)]:max-w-44 lg:[&:nth-child(4)]:truncate 
                        
                        [&:last-child]:px-4
                        
                        `}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center uppercase"
            >
              {props.data.length === 0
                ? "No expenses yet, add one to get started."
                : "No results found."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
