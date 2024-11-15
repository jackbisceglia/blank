/* eslint-disable solid/reactivity */ // not sure if this rule is accurate, but code is straight from shadcn-solid docs
import { TransactionWithPayeesWithContacts } from '@blank/core/db';

import { Badge, badgeVariants } from '@/components/ui/badge';
import { Checkbox, CheckboxControl } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { A } from '@solidjs/router';
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/solid-table';
import {
  Accessor,
  createSignal,
  For,
  Setter,
  Show,
  splitProps,
} from 'solid-js';

export const headers = {
  select: 'SELECTS',
  cost: 'COST',
  description: 'DESCRIPTION',
  payees: 'WITH',
  payer: 'PAID BY',
  date: 'DATE',
};

export const columns: ColumnDef<TransactionWithPayeesWithContacts>[] = [
  {
    id: 'selects',
    header: (props) => (
      <Checkbox
        disabled={props.table.options.meta?.disableGlobalActions?.()}
        indeterminate={props.table.getIsSomePageRowsSelected()}
        checked={props.table.getIsAllPageRowsSelected()}
        aria-label="Select all"
        class="translate-y-[2px] px-2"
        onChange={(checked) => {
          props.table.toggleAllPageRowsSelected(checked);
        }}
      >
        <CheckboxControl />
      </Checkbox>
    ),
    cell: (props) => (
      <Checkbox
        checked={props.row.getIsSelected()}
        value={props.row.getIsSelected() ? 'checked' : 'unchecked'}
        aria-label="Select row"
        class="translate-y-[2px]"
      >
        <CheckboxControl class="mx-2 " />
      </Checkbox>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: headers.cost,
    cell: (props) => (
      <span class="font-semibold">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(props.row.original.amount)}
      </span>
    ),
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: headers.description,
    cell(props) {
      return (
        <span class="font-semibold text-ui-foreground">
          {props.row.original.description}
        </span>
      );
    },
  },
  {
    id: 'payees',
    accessorKey: 'payees',
    header: headers.payees,
    cell: (props) => {
      return (
        <div class="flex flex-wrap gap-2 w-full h-full">
          <For each={props.row.original.payees}>
            {(payee) => (
              <A
                href={`/contacts/${payee.contact.id}`}
                class={badgeVariants({ variant: 'tertiary' })}
              >
                {payee.contact.name}
              </A>
            )}
          </For>
        </div>
      );
    },
  },
  {
    id: 'payer',
    accessorKey: 'payer',
    header: headers.payer,
    cell: () => {
      return (
        <Badge variant="default" class="hover:bg-ui-primary">
          YOU
        </Badge>
      );
    },
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: headers.date,
    cell: (props) =>
      new Date(props.row.original.date ?? '').toLocaleDateString(),
    size: 10,
  },
];

type Props<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: Accessor<TData[] | undefined>;
};

export const TransactionTable = <TData, TValue>(
  props: Props<TData, TValue> & {
    rows: {
      get: Accessor<Record<string, boolean>>;
      set: Setter<Record<string, boolean>>;
    };
  },
) => {
  const [local] = splitProps(props, ['columns', 'data']);
  const [lastTouched, setLastTouched] = createSignal<[number, boolean] | null>([
    0,
    false,
  ]);

  const table = createSolidTable({
    columns: local.columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange(updater) {
      props.rows.set(updater);
    },
    state: {
      get rowSelection() {
        return props.rows.get();
      },
    },
    get data() {
      return local.data() || [];
    },
    meta: {
      disableGlobalActions: () => !local.data()?.length,
      setLastTouched,
    },
  });

  return (
    <Table class="border text overflow-scroll">
      <TableHeader>
        <For each={table.getHeaderGroups()}>
          {(headerGroup) => (
            <TableRow class="h-14">
              <For each={headerGroup.headers}>
                {(header) => {
                  return (
                    <TableHead class="uppercase text-left pl-4 text-xs">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                }}
              </For>
            </TableRow>
          )}
        </For>
      </TableHeader>
      <TableBody class="text-ui-muted-foreground select-none">
        <Show
          when={table.getRowModel().rows.length}
          fallback={
            <TableRow>
              <TableCell
                colSpan={local.columns.length}
                class="h-24 w-fit text-center text-lg uppercase"
              >
                No results.
              </TableCell>
            </TableRow>
          }
        >
          <For each={table.getRowModel().rows}>
            {(row) => (
              <TableRow
                onClick={(e) => {
                  // TODO: this is a super partial implementation of multiselect w/ shift click
                  // we probably would need to do this at a different level to get checkbox on board
                  // it at least works for bulk select
                  // move into a different function
                  const last = lastTouched();
                  const rows = table.getRowModel().rows;
                  const selected = table.getSelectedRowModel().rows;

                  const handleMultiSelect = (
                    lastTouched: number,
                    toggledTo: boolean,
                  ) => {
                    const lower = Math.min(lastTouched, row.index);
                    const higher = Math.max(lastTouched, row.index);

                    for (let i = lower; i <= higher; i++) {
                      rows[i].toggleSelected(toggledTo);
                    }
                  };

                  const isMultiSelect =
                    e.shiftKey &&
                    selected.length > 0 &&
                    last &&
                    last[0] !== row.index;

                  if (isMultiSelect) {
                    handleMultiSelect(...last);
                  } else {
                    row.toggleSelected();
                  }

                  setLastTouched([row.index, row.getIsSelected()]);
                }}
                class="focus-within:outline-ui-foreground/50 focus-within:outline focus-within:bg-ui-muted"
                data-state={row.getIsSelected() && 'selected'}
              >
                <For each={row.getVisibleCells()}>
                  {(cell) => {
                    const id = cell.column.columnDef.id as string;
                    return (
                      <TableCell
                        data-column={id}
                        classList={{
                          'text-left pl-4 lowercase': true,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  }}
                </For>
              </TableRow>
            )}
          </For>
        </Show>
      </TableBody>
    </Table>
  );
};
