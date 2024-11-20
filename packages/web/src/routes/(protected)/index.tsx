import {
  getTransactions,
  useCreateTransaction,
  useDeleteTransactions,
} from './-transaction.data';
import { useNewTransactionDialog } from './+transaction.dialog';
import { columns, headers, TransactionTable } from './+transaction.table';

import { TransactionWithPayeesWithContacts } from '@blank/core/db';

import { Button, ButtonLoadable } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createAsync } from '@solidjs/router';
import { ColumnDef } from '@tanstack/solid-table';
import {
  Accessor,
  createSignal,
  Match,
  onMount,
  Show,
  Suspense,
  Switch,
} from 'solid-js';

const useRows = (
  data: Accessor<TransactionWithPayeesWithContacts[] | undefined>,
) => {
  const [rowSelection, setRowSelection] = createSignal<Record<string, boolean>>(
    {},
  );

  const resetRows = () => setRowSelection({});

  const selectedIds = () =>
    Object.keys(rowSelection())
      .map((stringIndex) => data()?.at(parseInt(stringIndex))?.id ?? '')
      .filter((id) => id !== '');

  return {
    reset: resetRows,
    selected: selectedIds,
    get: rowSelection,
    set: setRowSelection,
  };
};

const SkeletonTable = () => {
  const columns: ColumnDef<string>[] = Object.values(headers).map(
    (display) => ({
      header: display,
      cell: () => {
        return (
          <Switch fallback={<Skeleton class="w-5/6 h-5" />}>
            <Match when={display === headers.description}>
              <Skeleton class="w-20 h-5" />
            </Match>
            <Match when={display === headers.cost}>
              <Skeleton class="w-12 h-5" />
            </Match>
          </Switch>
        );
      },
    }),
  );

  const skeletonData = () => Array.from({ length: 10 }).map(() => '');

  return (
    <TransactionTable
      rows={{ get: () => ({}) as Record<string, boolean>, set: () => {} }}
      columns={columns}
      data={skeletonData}
    />
  );
};

export default function HomePage() {
  const transactions = createAsync(() => getTransactions());

  const [createTransaction, deleteTransaction] = [
    useCreateTransaction(),
    useDeleteTransactions(),
  ];

  const dialog = useNewTransactionDialog();
  const rows = useRows(transactions);

  const someRowsSelected = () => rows.selected().length > 0;

  const month = new Date().toLocaleString('default', { month: 'long' });

  onMount(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (someRowsSelected()) {
        if (e.ctrlKey && e.key === 'd') {
          await deleteTransaction.use(rows.selected(), rows.reset);
        } else if (e.key === 'Escape') {
          rows.reset();
        }
      }
    };

    // TODO: solid-utils has a keyboard thing i should use here
    window.addEventListener('keydown', (e) => void handleKeyDown(e));
  });

  return (
    <div class="w-full">
      <div class="w-full flex justify-between items-center py-2">
        <h1 class="text-left text-xl uppercase text-ui-primary">
          Overview - {month}
        </h1>
        {/* Button Bar */}
        <div class="flex items-center gap-2">
          <ButtonLoadable
            variant="destructive"
            size="sm"
            class="w-20"
            disabled={!someRowsSelected() || deleteTransaction.ctx.pending}
            loading={deleteTransaction.ctx.pending}
            onClick={() =>
              void deleteTransaction.use(rows.selected(), rows.reset)
            }
          >
            Delete
          </ButtonLoadable>
          <Button
            class="w-20"
            disabled={createTransaction.ctx.pending}
            onClick={dialog.open}
            variant="outline"
            size="sm"
          >
            New
          </Button>
        </div>
      </div>
      <Suspense fallback={<SkeletonTable />}>
        <Show
          when={transactions()}
          fallback={<p>No transactions yet . . . </p>}
        >
          {(transactions) => (
            <TransactionTable
              rows={{
                get: rows.get,
                set: rows.set,
              }}
              columns={columns}
              data={transactions}
            />
          )}
        </Show>
      </Suspense>
    </div>
  );
}
