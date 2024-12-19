import { useNewTransactionDialog } from './+transaction.create.dialog';
import { TransactionTable, columns } from './+transaction.table';
import { useRows } from './-useRows';
import {
  getGroup,
  useCreateTransaction,
  useDeleteTransactions,
  useDevOnlySeedTransactions,
} from './index.data';

import { Button, ButtonLoadable } from '@/components/ui/button';
import { createAsync, useParams } from '@solidjs/router';
import { Show, createMemo } from 'solid-js';

// we can't do this on mount because transactions hasn't loaded yet
// const useSyncUrlToRows = (
//   idFromURL: () => string | undefined,
//   transactions: Accessor<TransactionWithPayeesWithMembers[] | undefined>,
//   setSelected: Setter<Record<string, boolean>>,
//   singleRowSelected: () => boolean,
// ) => {

//   createEffect(() => {
//     if (!transactions()) return;

//     const id = idFromURL();
//     if (!singleRowSelected() && id) {
//       const index =
//         transactions()?.findIndex((t) => {
//           console.log('iteration', t.id);
//           return t.id === id;
//         }) ?? 0;

//       setSelected((prev) => ({ ...prev, [index.toString()]: true }));
//     }
//   });
// };
type Params = { id: string };

export default function GroupPage() {
  const params = useParams<Params>();
  const group = createAsync(() => getGroup(params.id));
  const transactions = createMemo(() => group()?.transactions);

  // eslint-disable-next-line solid/reactivity
  const rows = useRows(transactions);

  // derived state
  const someRowsSelected = () => rows.selected.size() > 0;

  // const singleRowSelected = () => rows.selected.size() === 1;
  // const singleRowSelectedTransaction = () =>
  //   transactions()?.[rows.selected.indices()[0]];

  // crud
  const [createTransaction, deleteTransaction] = [
    useCreateTransaction(),
    useDeleteTransactions(),
    useDevOnlySeedTransactions(),
  ];
  const createDialog = useNewTransactionDialog();

  return (
    <>
      <div class="flex flex-col gap-2 py-1 w-full sm:flex-row sm:justify-between sm:items-center">
        {/* Button Bar */}
        <div class="flex items-center gap-2 w-full sm:w-fit">
          <Button
            class="w-1/3 sm:w-20"
            disabled={createTransaction.ctx.pending}
            onClick={createDialog.open}
            variant="outline"
            size="sm"
          >
            New
          </Button>
          <ButtonLoadable
            variant="destructive"
            size="sm"
            class="w-1/3 sm:w-20"
            disabled={!someRowsSelected() || deleteTransaction.ctx.pending}
            loading={deleteTransaction.ctx.pending}
            onClick={() =>
              void deleteTransaction.use(rows.selected.ids(), rows.reset)
            }
          >
            Delete
          </ButtonLoadable>
          {/* <ButtonLoadable
            variant="ghost"
            size="sm"
            class="*"
            loading={devOnlySeedTransactions.ctx.pending}
            onClick={() => void devOnlySeedTransactions.use()}
          >
            *
          </ButtonLoadable> */}
        </div>
      </div>
      <Show when={transactions()} fallback={<p>No transactions yet . . . </p>}>
        {(transactions) => (
          <TransactionTable
            rows={rows}
            dialogs={{
              create: {
                state: createDialog.state,
                open: createDialog.open,
              },
              edit: {
                state: () => 'closed',
                open: () => {},
              },
            }}
            data={transactions}
            columns={columns}
          />
        )}
      </Show>
    </>
  );
}
