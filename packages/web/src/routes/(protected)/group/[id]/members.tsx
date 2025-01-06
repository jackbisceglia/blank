import { GroupParams } from '.';
import {
  StyledCardDescription,
  StyledCardHeader,
  StyledCardListItem,
  StyledCardTitle,
} from './+styled-card';
import { getGroupDetails } from './index.data';

import { Member } from '@blank/core/zero';

import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TextFieldRoot } from '@/components/ui/textfield';
import { UserBadge } from '@/components/user-badge';
import { cn } from '@/lib/cn';
import { createSignalBoundTextField } from '@/lib/util.client';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import {
  For,
  Match,
  ParentProps,
  Show,
  Switch,
  createMemo,
  createSignal,
  onMount,
} from 'solid-js';

interface EditableTextProps extends ParentProps {
  save?: (newState: string) => void;
  value: string;
}

function EditableText(props: EditableTextProps) {
  const [state, setState] = createSignal<'read' | 'write'>('read');
  const [[edited], EditableTextInput] = createSignalBoundTextField<string>(
    props.value,
  );

  function AutofocusingEditableTextInput() {
    let inputRef: HTMLInputElement | undefined;

    onMount(() => {
      inputRef?.focus();
    });

    return (
      <TextFieldRoot>
        <EditableTextInput ref={inputRef} />
      </TextFieldRoot>
    )
  }

  return (
    <Switch>
      <Match when={state() === 'read'}>
        <p class="uppercase text-ui-foreground">{props.value}</p>
        <Button
          variant="ghost"
          class="flex text-xs uppercase px-2 text-ui-foreground/75 py-1 h-min mb-auto"
          onClick={() => setState('write')}
        >
          edit
        </Button>
      </Match>
      <Match when={state() === 'write'}>
        <div class="flex gap-1 space-y-0 items-center">
          <AutofocusingEditableTextInput />
          <Button
            variant="ghost"
            class="flex text-xs uppercase px-2 text-ui-foreground/75 py-1 h-min mb-auto hover:text-ui-primary"
            onClick={() => {
              props.save?.(edited());
              setState('read');
            }}
          >
            save
          </Button>
          <Button
            variant="ghost"
            class="flex text-xs uppercase px-2 text-ui-foreground/75 py-1 h-min mb-auto hover:text-ui-destructive"
            onClick={() => {
              props.save?.(edited());
              setState('read');
            }}
          >
            cancel
          </Button>
        </div>
      </Match>
    </Switch>
  );
}

export default function MembersPage() {
  const params = useParams<GroupParams>();
  const z = useZero();
  const session = useUser();

  const group = useQuery(() =>
    getGroupDetails(z, params.id, session.user()?.id ?? ''),
  );

  const orderedMembers = createMemo(() => {
    const g = group();
    if (!g) return [];

    const members = [...g.members];

    const currentUserMember = members.find(
      (m) => m.userId === session.user()?.id,
    );

    return members.sort((a, b) => {
      if (a.userId === currentUserMember?.userId) return -1;
      if (b.userId === currentUserMember?.userId) return 1;
      return 0;
    });
  });

  const currentUserMember = (): Member | undefined => orderedMembers()[0];

  const requireCurrentUserIsMember = () => {
    if (!currentUserMember())
      throw Error('User is not authorized to edit group details');
  };

  async function updateNickname(
    nickname: string,
    groupId: string,
    userId: string,
  ) {
    requireCurrentUserIsMember();

    await z.mutate.member.update({
      nickname: nickname,
      groupId: groupId,
      userId: userId,
    });
  }

  async function leaveGroup(groupId: string, userId: string) {
    requireCurrentUserIsMember();

    await z.mutate.member.delete({
      groupId: groupId,
      userId: userId,
    });
  }

  return (
    <>
      <div class="flex flex-col space-y-1.5 text-left pb-2">
        <StyledCardTitle>group members</StyledCardTitle>
        <StyledCardDescription>
          manage your group's members
        </StyledCardDescription>
      </div>
      <ul class="gap-4 grid-cols-1 grid md:grid-cols-2">
        <For each={orderedMembers()}>
          {(member) => (
            <StyledCardListItem class="h-full p-2 gap-2">
              <StyledCardHeader class="flex flex-row gap-4 items-center h-full space-y-0 p-2">
                <UserBadge
                  gradientHash={member.userId
                    .split('')
                    .reduce((sum, char) => sum + char.charCodeAt(0), 0)}
                  variant="static"
                  class="size-10 select-none"
                >
                  {member.nickname.slice(0, 2)}
                </UserBadge>
                <Switch>
                  <Match when={member.userId === session.user()?.id}>
                    <EditableText
                      value={member.nickname}
                      save={(newNickname: string) => {
                        if (newNickname === member.nickname) return;

                        void updateNickname(
                          newNickname,
                          group()?.id ?? '',
                          session.user()?.id ?? '',
                        );
                      }}
                    />
                  </Match>
                  <Match when={member.userId !== session.user()?.id}>
                    <p class="uppercase text-ui-foreground">
                      {member.nickname}
                    </p>
                  </Match>
                </Switch>

                <Show
                  when={
                    member.userId === group()?.ownerId ||
                    member.userId === session.user()?.id
                  }
                >
                  <div class="ml-auto flex gap-4">
                    <Show when={member.userId === group()?.ownerId}>
                      <Badge class="text-xs h-fit" variant="default">
                        admin
                      </Badge>
                    </Show>
                    <Show when={member.userId === session.user()?.id}>
                      <Dialog>
                        <DialogTrigger
                          as={Button}
                          class={cn(
                            'text-xs py-1 h-fit',
                            badgeVariants({ variant: 'destructive' }),
                          )}
                        >
                          Leave
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle class="uppercase">
                              Leave Group
                            </DialogTitle>
                            <DialogDescription class="lowercase">
                              Are you sure you want to leave this group? This
                              action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              class="w-full uppercase"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                void leaveGroup(
                                  group()?.id ?? '',
                                  session.user()?.id ?? '',
                                )
                              }
                            >
                              Leave Group
                            </Button>
                            <Button
                              class="w-full uppercase"
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </Show>
                  </div>
                </Show>
              </StyledCardHeader>
            </StyledCardListItem>
          )}
        </For>
      </ul>
    </>
  );
}
