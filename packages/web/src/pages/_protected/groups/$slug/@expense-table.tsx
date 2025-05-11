import { Badge } from "@/components/ui/badge";
import { Expense, Member, Participant } from "@blank/zero";
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
import { useRef } from "react";

type ParticipantWithMember = Participant & { member: Member | undefined };

export type Columns = Expense & { participants: ParticipantWithMember[] };

const isKey = (key: string, set: string[]) => set.includes(key);

const keys = {
  up: ["j", "ArrowUp"],
  down: ["k", "ArrowDown"],
  select: ["Enter", " "],
};

const isTableNavUp = (key: string) => isKey(key, keys.up);
const isTableNavDown = (key: string) => isKey(key, keys.down);

const isTableSelect = (key: string) => isKey(key, keys.select);

type ParticipantBadgeListProps = {
  participants: Columns["participants"];
};

function ParticipantBadgeList(props: ParticipantBadgeListProps) {
  const participants = props.participants.filter(
    (p): p is typeof p & { member: NonNullable<typeof p.member> } =>
      p.member !== undefined
  );

  if (participants.length !== props.participants.length) return null;

  return (
    <ul className="flex gap-1 list-none">
      {participants.map((p) => (
        <li key={p.userId}>
          <Badge variant={p.role === "participant" ? "secondary" : "theme"}>
            {p.member.nickname}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

const columnHelper = createColumnHelper<Columns>();

const columns = [
  columnHelper.accessor("amount", {
    header: "Cost",
    cell: (opts) => <p className="w-min">{`$${opts.getValue().toString()}`}</p>,
  }),
  columnHelper.accessor("description", {
    cell: (opts) => (
      <p className="text-foreground font-medium text-sm lowercase">
        {opts.getValue().toString()}
      </p>
    ),
  }),
  columnHelper.accessor("participants", {
    cell: (opts) => <ParticipantBadgeList participants={opts.getValue()} />,
  }),
  columnHelper.accessor("date", {
    cell: (opts) => new Date(opts.getValue()).toLocaleDateString(),
  }),
];

type DataTableProps = {
  data: Columns[];
};

export function DataTable(props: DataTableProps) {
  const table = useReactTable({
    data: props.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const rowRefs = useRef<HTMLTableRowElement[]>([]);

  return (
    <div className="rounded-md h-fit">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
            table.getRowModel().rows.map((row) => (
              <TableRow
                ref={(el) => {
                  if (!el) return;
                  rowRefs.current[row.index] = el;
                }}
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => row.toggleSelected(!row.getIsSelected())}
                className="hover:bg-blank-theme-background/25 transition-colors"
                role="checkbox"
                aria-checked={row.getIsSelected()}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (isTableSelect(e.key)) {
                    e.preventDefault();
                    row.toggleSelected(!row.getIsSelected());
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
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
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
