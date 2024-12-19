/* eslint-disable solid/reactivity */ // not sure if this rule is accurate, but code is straight from shadcn-solid docs

// import { useRows } from '.';
import { DialogState } from './+transaction.create.dialog';
import { useRows } from './-useRows';
import { useDeleteTransactions } from './index.data';

// import { useDeleteTransactions } from './-transaction.data';

import { TransactionWithPayeesWithMembers } from '@blank/core/db';

import { Badge, badgeVariants } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// import { A } from '@solidjs/router';
import {
  Row,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/solid-table';
import {
  Accessor,
  For,
  Setter,
  Show,
  createSignal,
  splitProps,
} from 'solid-js';

const createKeyboardNav = () => {
  const directions = ['up', 'down'] as const;
  type Directions = (typeof directions)[number];

  type Actions = Directions;

  const handleKeyboardNav = (
    keypress: string,
    focusNext: () => void,
    focusPrevious: () => void,
    // select: () => void,
  ) => {
    type DirectionConfig = {
      check: (k: string) => boolean;
      handle: () => void;
    };

    const actions: Record<Actions, DirectionConfig> = {
      down: {
        check: (k) => ['ArrowDown', 'j'].includes(k),
        handle: () => {
          focusNext();
        },
      },
      up: {
        check: (k) => ['ArrowUp', 'k'].includes(k),
        handle: () => {
          focusPrevious();
        },
      },
    };

    if (actions.up.check(keypress)) {
      actions.up.handle();
    } else if (actions.down.check(keypress)) {
      actions.down.handle();
    }
  };

  return {
    directions,
    handleKeyboardNav,
  };
};

function createRowSelect<TData>(
  getRows: Accessor<Row<TData>[]>,
  getSelected: Accessor<Row<TData>[]>,
  anchors: {
    get: Accessor<number[]>;
    set: Setter<number[]>;
  },
) {
  const toggleRange = (
    low: number = 0,
    high: number = getRows().length,
    opts?: {
      to?: boolean;
      exclude?: number[];
      custom?: {
        low: number;
        high: number;
        to: boolean;
      };
    },
  ) => {
    const rows = getRows();
    for (let i = low; i < high; i++) {
      if ((opts?.exclude ?? []).includes(i)) continue;

      if (opts?.custom) {
        if (i >= opts.custom.low && i <= opts.custom.high) {
          rows[i].toggleSelected(opts.custom.to);
          continue;
        }
      }

      rows[i].toggleSelected(opts?.to);
    }
  };

  const handleSelectAnchor = (row: Row<TData>) => {
    const rows = getRows();
    const selected = getSelected();
    row.toggleSelected(selected.length > 1 ? true : undefined);

    toggleRange(0, rows.length, {
      to: false,
      exclude: [row.index],
    });

    anchors.set([row.index]);
  };

  const handleSelectRange = (row: Row<TData>) => {
    const rows = getRows();
    if (anchors.get().length === 0) return;

    const anchor = anchors.get()[0];
    const low = Math.min(anchor, row.index);
    const high = Math.max(anchor, row.index);

    toggleRange(0, rows.length, {
      to: false,
      custom: {
        low,
        high,
        to: true,
      },
    });
  };

  const handleSelectUnion = (row: Row<TData>) => {
    row.toggleSelected();

    if (row.getIsSelected()) {
      anchors.set([row.index, ...anchors.get()]);
    } else if (anchors.get()[0] === row.index) {
      const [, ...tail] = anchors.get();
      anchors.set(tail);
    }
  };

  return {
    handleSelectAnchor,
    handleSelectRange,
    handleSelectUnion,
  };
}

export const headers = {
  // select: 'SELECTS',
  cost: 'COST',
  description: 'DESCRIPTION',
  payees: 'WITH',
  payer: 'PAID BY',
  date: 'DATE',
};

export const columns: ColumnDef<TransactionWithPayeesWithMembers>[] = [
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
              // <A
              //   href={`/contacts/${payee.contact.id}`}
              //   class={badgeVariants({ variant: 'tertiary' })}
              // >
              //   {payee.contact.name}
              // </A>
              <p class={badgeVariants({ variant: 'tertiary' })}>
                {payee.member.nickname}
              </p>
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
    rows: ReturnType<typeof useRows> | null;
    dialogs: {
      create: {
        state: () => DialogState;
        open: () => void;
      };
      edit: {
        state: () => DialogState;
        open: () => void;
      };
    };
  },
) => {
  const [local] = splitProps(props, ['columns', 'data']);
  const [anchors, setAnchors] = createSignal<number[]>([]);

  const table = createSolidTable({
    columns: local.columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange(updater) {
      props.rows?.set(updater);
    },
    state: {
      get rowSelection() {
        return props.rows?.get();
      },
    },
    get data() {
      return local.data() || [];
    },
    meta: {
      disableGlobalActions: () => !local.data()?.length,
      setAnchors,
    },
  });

  const getRows = () => table.getRowModel().rows;
  const getSelected = () => table.getSelectedRowModel().rows;

  const rowSelect = createRowSelect(getRows, getSelected, {
    get: anchors,
    set: setAnchors,
  });

  const deleteTransaction = useDeleteTransactions();

  const keyboardnav = (e: KeyboardEvent | PointerEvent, row: Row<TData>) => {
    const selected = getSelected();

    const isRangeToggle =
      e.shiftKey && selected.length > 0 && anchors()[0] !== row.index;

    const isMultiSelect = e.metaKey && selected.length > 0;

    if (isRangeToggle) {
      rowSelect.handleSelectRange(row);
    } else if (isMultiSelect) {
      rowSelect.handleSelectUnion(row);
    } else {
      rowSelect.handleSelectAnchor(row);
    }
  };

  return (
    <Table
      ref={(table) => {
        const dialogs = [
          props.dialogs.create.state,
          props.dialogs.edit.state,
        ] as const;
        const handleKeyDown = async (e: KeyboardEvent) => {
          const keys = ['d', 'e'];
          if (
            getSelected().length < 1 ||
            dialogs.some((d) => d() === 'open') ||
            !keys.includes(e.key)
          ) {
            return;
          }

          switch (e.key) {
            case 'd': {
              await deleteTransaction.use(
                props.rows?.selected.ids() as string[],
                props.rows?.reset,
              );

              break;
            }
            case 'e': {
              props.dialogs.edit.open();
              break;
            }
          }
        };

        table.addEventListener('keydown', (e) => void handleKeyDown(e));
      }}
      class="border text overflow-scroll"
    >
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
      <TableBody
        onKeyPress={(e) => {
          const { directions, handleKeyboardNav } = createKeyboardNav();

          type Directions = (typeof directions)[number];

          const findTR = (element: HTMLElement | null): HTMLElement | null => {
            if (!element) return null;
            if (element.tagName === 'TR') return element;

            return findTR(element.parentElement);
          };

          const getSibling = (dir: Directions) => {
            const row = findTR(e.target as HTMLElement);

            const sibling =
              dir === 'up'
                ? row?.previousElementSibling
                : row?.nextElementSibling;

            return sibling as HTMLElement | null | undefined;
          };

          const [focusPrevious, focusNext] = directions.map((dir) => () => {
            getSibling(dir)?.focus();
          });

          handleKeyboardNav(e.key, focusNext, focusPrevious);
        }}
        class="text-ui-muted-foreground select-none"
      >
        <Show
          when={table.getRowModel().rows.length}
          fallback={
            <TableRow>
              <TableCell
                colSpan={local.columns.length}
                class="h-24 text-center text-lg uppercase"
              >
                No results.
              </TableCell>
            </TableRow>
          }
        >
          <For each={table.getRowModel().rows}>
            {(row) => (
              <TableRow
                onKeyPress={(e) => {
                  e.preventDefault();
                  if (!([' ', 'Enter'].includes(e.key) || e.metaKey)) return;

                  keyboardnav(e, row);
                }}
                onPointerDown={(e) => {
                  keyboardnav(e, row);
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
