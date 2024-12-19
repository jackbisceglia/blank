import { TransactionTable, headers } from './[id]/+transaction.table';
import { getGroup } from './[id]/index.data';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { navigation } from '@/lib/signals';
import { A, RouteSectionProps, createAsync, useParams } from '@solidjs/router';
import { ColumnDef } from '@tanstack/solid-table';
import { Match, Suspense, Switch, onMount } from 'solid-js';

type Params = { id: string };

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

  const skeletonData = () => Array.from({ length: 12 }).map(() => '');

  return (
    <TransactionTable
      dialogs={{
        create: { open: () => {}, state: () => 'closed' },
        edit: { open: () => {}, state: () => 'closed' },
      }}
      rows={null}
      columns={columns}
      data={skeletonData}
    />
  );
};

function PageSkeleton() {
  return (
    <>
      <div class="flex flex-col gap-2 py-1 w-full sm:flex-row sm:justify-between sm:items-center">
        {/* Button Bar */}
        <div class="flex items-center gap-2 w-full sm:w-fit">
          <Button
            class="w-1/3 sm:w-20"
            disabled={true}
            variant="outline"
            size="sm"
          >
            New
          </Button>
          <Button
            variant="destructive"
            size="sm"
            class="w-1/3 sm:w-20"
            disabled={true}
          >
            Delete
          </Button>
          <Button variant="ghost" size="sm" disabled={true}>
            *
          </Button>
        </div>
      </div>
      <SkeletonTable />
    </>
  );
}

export default function GroupLayout(props: RouteSectionProps) {
  const params = useParams<Params>();
  const group = createAsync(() => getGroup(params.id));
  const DIVIDER = ' / ';

  return (
    <>
      <div class="flex flex-col gap-2 py-1 w-full sm:flex-row sm:justify-between sm:items-center">
        <h1 class="text-left text-xl uppercase text-ui-foreground ">
          <A class="text-ui-foreground/50 hover:text-ui-foreground" href={'/'}>
            Home
          </A>
          <span class="text-ui-foreground/50 ">{DIVIDER}</span>
          <Suspense fallback={navigation.groupClicked ?? ''}>
            {group()?.title}
          </Suspense>
        </h1>
      </div>
      <Suspense fallback={<PageSkeleton />}>{props.children}</Suspense>
    </>
  );
}
