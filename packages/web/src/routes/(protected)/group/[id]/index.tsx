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

import { Button, ButtonLoadable } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserBadge } from '@/components/user-badge';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { useNavigate, useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { For, Show, createEffect, createMemo } from 'solid-js';

export type GroupParams = { id: string };

export default function GroupPage() {
  const navigate = useNavigate();
  const params = useParams<GroupParams>();
  const session = useUser();
  const z = useZero();

  const group = useQuery(() =>
    getGroupDetails(z, params.id, session.user()?.id ?? ''),
  );
  const transactionsMutable = createMemo(
    () =>
      JSON.parse(JSON.stringify(group()?.transactions ?? {})) as Transaction[],
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
        <div class="flex gap-1.5 px-2">
          <For each={group()?.members}>
            {(member) => (
              <Tooltip>
                <TooltipTrigger>
                  <UserBadge
                    gradientHash={[member.id, member.nickname]
                      .join('')
                      .split('')
                      .reduce((sum, char) => sum + char.charCodeAt(0), 0)}
                    href="members"
                    variant="link"
                  >
                    {member.nickname.slice(0, 2)}
                  </UserBadge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{member.nickname}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </For>
        </div>

        <Select
          class="h-full"
          options={['Current', 'Past']}
          value={'Current'}
          placeholder="Select a fruit…"
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
          )}
        >
          <SelectTrigger class="text-xs px-0 pl-3.5 pr-2.5 w-1/3 py-0 h-full sm:w-28 uppercase justify-between gap-0">
            <SelectValue<string>>
              {(state) => state.selectedOption()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
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
