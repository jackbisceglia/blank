import { useNewGroupDialog } from './+group.create.dialog';
import { getGroupsUserBelongsTo } from './index.data';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardHeader,
  CardTitle,
  LinkCard,
} from '@/components/ui/card';
import { navigation } from '@/lib/signals';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { useUser } from 'clerk-solidjs';
import { For, Show } from 'solid-js';

const C = '\\';
const blank = `
________    ___         ________    ________     ___  __
 |.   __  .  |.  .       |.   __  .  |.   ___  .  |.  .|.  .
   . .  .|. /. . .  .      . .  .|.  . . .  .. .  . . .  ./  /|_
     . .   __  . . .  .      . .   __  . . .  .. .  . . .   ___  .
       . .  .|.  . . .  ._____ . .  . .  . . .  .. .  . . .  .. .  .
         . ._______. . ._______. . .__. .__. . .__.. .__. . .__.. .__.
          .|_______|  .|_______|  .|__|.|__|  .|__| .|__|  .|__| .|__|`;

type NoGroupsViewProps = {
  open: () => void;
};

const NoGroupsView = (props: NoGroupsViewProps) => {
  return (
    <div class="relative flex flex-col items-center justify-center gap-4 h-full mb-16">
      <div class="overflow-clip absolute -z-10 flex flex-col items-center justify-center text-3xl select-none">
        <pre class="text-center opacity-100 text-ui-muted">
          {blank.replaceAll('.', C)}
        </pre>
      </div>

      {/* Content */}
      <div class="flex flex-col items-center justify-center gap-4">
        <div class="space-y-2 text-center">
          <h3 class="text-2xl font-semibold uppercase">No Groups Yet</h3>
          <p class="text-muted-foreground lowercase">
            Create your first group to start collaborating with others
          </p>
        </div>
        <Button onClick={props.open} class="uppercase text-sm">
          Create New Group
        </Button>
      </div>
    </div>
  );
};

// currently pretty hacky way to handle loading states inside of this guy
type GroupCardProps = {
  id: string;
  name: string;
  lastSettledAt: string;
  memberCount: number;
  isOwner: boolean;
};

const GroupCard = (props: GroupCardProps) => {
  const dolla = `   ___         
 _|/  /__      
|/   ____/     
/ /  /___|_    
 / /_____  /   
  /|____|/  /  
    ____/_/  / 
   |/___    __/
   /|___|/__/_|
        /|__|`;

  return (
    <LinkCard
      aria-busy={props.id === 'loading'}
      onPointerDown={() => (navigation.groupClicked = props.name)}
      href={props.id === 'loading' ? '/' : `/group/${props.id}`}
      class="group relative w-full overflow-hidden px-6 py-4 border border-ui-input bg-ui-background hover:bg-ui-accent hover:text-ui-accent-foreground transition-all duration-100 rounded-sm"
    >
      <CardHeader class="w-full space-y-0 flex-row items-center flex p-0 gap-2">
        <CardTitle>
          <h2 class="text-lg uppercase font-medium">{props.name}</h2>
        </CardTitle>
        <Show when={props.isOwner}>
          <Badge
            variant="default"
            class="hover:bg-ui-primary border-0 flex h-min py-1 text-xs px-2 text-[0.7rem] uppercase leading-none"
          >
            You
          </Badge>
        </Show>
      </CardHeader>
      <CardContent class="px-0 py-3 flex flex-col items-start justify-between gap-1.5">
        {/* start background */}
        <div class="overflow-clip top-0 right-0 absolute z-0 flex flex-col items-center justify-center text-xs select-none">
          <pre class="transition-all duration-100 text-center opacity-100 text-ui-muted group-hover:text-ui-primary/75">
            {dolla.replaceAll('\n\n', '').replaceAll('/', C)}
          </pre>
        </div>
        {/* end background */}
        <p class="text-sm text-ui-muted-foreground lowercase">
          {props.memberCount !== -1 ? props.memberCount : '_'} member
          {props.memberCount > 1 ? 's' : ''}
        </p>
        <p class="text-sm text-ui-muted-foreground lowercase">
          settled {props.lastSettledAt}
        </p>
      </CardContent>
    </LinkCard>
  );
};

export default function DashboardPage() {
  const session = useUser();
  const z = useZero();

  const groups = useQuery(() =>
    getGroupsUserBelongsTo(z, session.user()?.id ?? ''),
  );

  const createGroupDialog = useNewGroupDialog();

  return (
    <>
      <Show when={groups()}>
        <createGroupDialog.Component />
      </Show>

      <div class="flex gap-2 py-1 w-full justify-between sm:items-center">
        <h1 class="text-left text-xl uppercase text-ui-foreground">
          Welcome back,{' '}
          <Show when={session.user()} fallback={'...'}>
            {session.user()?.username}
          </Show>
        </h1>
        {/* Button Bar */}
        <div class="flex items-center gap-2 sm:w-fit">
          <Button
            class="w-full"
            onClick={createGroupDialog.open}
            // disabled={createGroup.ctx.pending} // TODO: user maxes out group count
            variant="default"
            size="sm"
          >
            New Group
          </Button>
        </div>
      </div>
      <Show when={session.user()}>
        <Show when={groups()}>
          {(groups) => (
            <Show
              when={!!groups().length}
              fallback={<NoGroupsView open={createGroupDialog.open} />}
            >
              <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <For each={groups()}>
                  {(group) => (
                    <GroupCard
                      id={group.id}
                      name={group.title}
                      lastSettledAt={new Date().toLocaleDateString('default')}
                      memberCount={group.members.length}
                      isOwner={group.ownerId === session.user()?.id}
                    />
                  )}
                </For>
              </ul>
            </Show>
          )}
        </Show>
      </Show>
    </>
  );
}
