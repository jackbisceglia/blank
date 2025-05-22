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
import { PropsWithChildren, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Expenses } from "./page";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import React from "react";

const isKey = (key: string, set: string[]) => set.includes(key);

const keys = {
  up: ["j", "ArrowUp"],
  down: ["k", "ArrowDown"],
  select: ["Enter", " "],
};

const isTableNavUp = (key: string) => isKey(key, keys.up);
const isTableNavDown = (key: string) => isKey(key, keys.down);

const isTableSelect = (key: string) => isKey(key, keys.select);

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
      className="overflow-x-hidden truncate block"
      variant={variant}
      {...rest}
    >
      {children}
    </Badge>
  )
);

BadgeSimple.displayName = "BadgeSimple";

type ParticipantBadgeProps = {
  participant: Expenses["participants"][number];
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
  participants: Expenses["participants"];
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

const columnHelper = createColumnHelper<Expenses>();

const columns = [
  columnHelper.accessor("amount", {
    header: "Cost",
    cell: (opts) => `$${opts.getValue().toString()}`,
  }),
  columnHelper.accessor("description", {
    cell: (opts) => (
      <p className="text-foreground font-medium lowercase w-full">
        {opts.getValue().toString()}
      </p>
    ),
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
    id: "checked",
    cell: (props) => (
      <Button
        onClick={() => props.table.options.meta?.expand(props.row.id)}
        size="xs"
        variant="outline"
        className="uppercase py-1 px-3.5 border-border"
      >
        Manage
      </Button>
    ),
    size: 32,
  }),
];

type DataTableProps = {
  expand: (id: string) => void;
  data: Expenses[];
};

export function DataTable(props: DataTableProps) {
  const table = useReactTable({
    data: props.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: {
      expand: props.expand,
    },
  });

  const rowRefs = useRef<HTMLTableRowElement[]>([]);

  return (
    <div className="rounded-md h-fit">
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
              const select = () => {
                const isSelected = row.getIsSelected();
                table.resetRowSelection();

                if (!isSelected) {
                  row.toggleSelected(true);
                }
              };

              return (
                <TableRow
                  ref={(el) => {
                    if (!el) return;
                    rowRefs.current[row.index] = el;
                  }}
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={select}
                  className="hover:bg-blank-theme-background/25 transition-colors"
                  role="checkbox"
                  aria-checked={row.getIsSelected()}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (isTableSelect(e.key)) {
                      e.preventDefault();
                      select();
                    }

                    if (isTableNavUp(e.key) || isTableNavDown(e.key)) {
                      e.preventDefault();
                      const delta = isTableNavUp(e.key) ? 1 : -1;

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

                        [&:nth-child(3)]:min-w-min [&:nth-child(3)]:w-min [&:nth-child(3)]:max-w-28 [&:nth-child(3)]:truncate
                        lg:[&:nth-child(3)]:min-w-min lg:[&:nth-child(3)]:w-min lg:[&:nth-child(3)]:max-w-32 lg:[&:nth-child(3)]:truncate

                        [&:nth-child(4)]:min-w-fit [&:nth-child(4)]:w-fit [&:nth-child(4)]:max-w-36 [&:nth-child(4)]:truncate

                        lg:[&:nth-child(4)]:min-w-min lg:[&:nth-child(4)]:w-min lg:[&:nth-child(4)]:max-w-44 lg:[&:nth-child(4)]:truncate 
                        
                        [&:last-child]:px-4
                        
                        `}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
                No expenses yet, add one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
