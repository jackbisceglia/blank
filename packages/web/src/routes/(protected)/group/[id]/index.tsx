import { useNewTransactionDialog } from './+transaction.create.dialog';
import { TransactionTable, columns } from './+transaction.table';
import { useRows } from './-useRows';
import {
  getGroupDetails,
  useCreateTransaction,
  useDeleteTransactions,
  useDevOnlySeedTransactions,
} from './index.data';

import { Transaction } from '@blank/core/zero';

import { badgeVariants } from '@/components/ui/badge';
import { Button, ButtonLoadable } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { A, useNavigate, useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { For, Show, createEffect, createMemo } from 'solid-js';

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
//
const badgeGradientClasslist = (id: string, nickname: string) => {
  const value = [id, nickname]
    .map((value) =>
      value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0),
    )
    .reduce((sum, value) => sum + value, 0);

  const gradientPart = `bg-gradient-to-br from-ui-primary`;

  // i can't make this dynamic, so hardcoded it is, for now
  return {
    [`${gradientPart} to-orange-400`]: value % 8 === 0,
    [`${gradientPart} to-red-400`]: value % 8 === 1,
    [`${gradientPart} to-violet-400`]: value % 8 === 2,
    [`${gradientPart} to-fuschia-400`]: value % 8 === 3,
    [`${gradientPart} to-rose-400`]: value % 8 === 4,
    [`${gradientPart} to-teal-400`]: value % 8 === 5,
    [`${gradientPart} to-yellow-400`]: value % 8 === 6,
    [`${gradientPart} to-sky-400`]: value % 8 === 7,
  };
};

export type GroupParams = { id: string };

export default function GroupPage() {
  const navigate = useNavigate();
  const params = useParams<GroupParams>();
  const session = useUser();
  const z = useZero();

  const group = useQuery(() => getGroupDetails(z, params.id));
  const transactionsMutable = createMemo(
    () => JSON.parse(JSON.stringify(group()?.transactions)) as Transaction[],
  ); // TODO: i should find a better deep clone solution that also strips readonly modifier, this is temp

  createEffect(() => {
    const g = group();
    if (g && !g.members.find((m) => m.userId === session.user()?.id)) {
      navigate('/dashboard');
    }
  });

  // eslint-disable-next-line solid/reactivity
  const rows = useRows(transactionsMutable);

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
        <div class="flex gap-2 w-full">
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
        </div>
        <div class="flex gap-2 px-2">
          <For each={group()?.members}>
            {(member) => (
              <A
                href="members"
                class={cn(
                  badgeVariants({ variant: 'default' }),
                  'border-primary bg-transparent rounded-full h-min aspect-square p-1.5 text-xs leading-none',
                )}
                classList={badgeGradientClasslist(member.id, member.nickname)}
              >
                {member.nickname.slice(0, 2)}
              </A>
            )}
          </For>
        </div>
      </div>
      <Show
        when={transactionsMutable()}
        fallback={<p>No transactions yet . . . </p>}
      >
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

/*
 The type 
 '''
   'readonly { readonly id: string; readonly groupId: string; readonly payerId: string; readonly amount: number; readonly date: number; readonly description: string; readonly payees: readonly { readonly id: string; readonly groupId: string; readonly userId: string; readonly nickname: string; }[]; }[]'
 '''
  is 'readonly' and cannot be assigned to the mutable type 
 '''
   '{ readonly id: string; readonly groupId: string; readonly payerId: string; readonly amount: number; readonly date: number; readonly description: string; readonly payees: readonly { readonly id: string; readonly groupId: string; readonly userId: string; readonly nickname: string; }[]; }[]'
 '''
*/
