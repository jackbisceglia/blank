import { GroupParams } from '.';
import {
  StyledCard,
  StyledCardContent,
  StyledCardDescription,
  StyledCardHeader,
  StyledCardTitle,
} from './+styled-card';
import { getGroupDetails } from './index.data';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// ... existing imports ...
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TextFieldLabel, TextFieldRoot } from '@/components/ui/textfield';
import { UserBadge } from '@/components/user-badge';
import { createSignalBoundTextField } from '@/lib/util.client';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { For, Show, createMemo } from 'solid-js';

export default function MembersPage() {
  const params = useParams<GroupParams>();
  const z = useZero();
  const session = useUser();

  const group = useQuery(() =>
    getGroupDetails(z, params.id, session.user()?.id ?? ''),
  );
  const members = createMemo(() => group()?.members ?? []);
  const currentUserMember = () =>
    members().find((m) => m.userId === session.user()?.id);

  async function updateNickname(memberId: string, nickname: string) {
    if (!currentUserMember()) return;

    await z.mutate.member.update({
      nickname: nickname,
      id: memberId,
    });
  }

  async function leaveGroup() {
    const current = currentUserMember();
    if (!current) return;

    await z.mutate.member.delete({
      id: current.id,
    });
  }

  const [[nickname], NicknameInput] = createSignalBoundTextField<string>(
    currentUserMember()?.nickname ?? '',
  );

  return (
    <StyledCard>
      <StyledCardHeader>
        <StyledCardTitle>group members</StyledCardTitle>
        <Show when={currentUserMember()}>
          <Dialog>
            <DialogTrigger
              class="h-full"
              as={Button}
              variant="outline"
              size="sm"
            >
              Leave Group
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure you want to leave?</DialogTitle>
              </DialogHeader>
              <div class="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => void leaveGroup()}>
                  Leave
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Show>
        <StyledCardDescription>
          manage your group's members
        </StyledCardDescription>
      </StyledCardHeader>
      <StyledCardContent>
        <div class="space-y-4">
          <For each={members()}>
            {(member) => (
              <div class="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div class="flex items-center space-x-4">
                  <UserBadge
                    gradientHash={[member.id, member.nickname]
                      .join('')
                      .split('')
                      .reduce((sum, char) => sum + char.charCodeAt(0), 0)}
                    variant="static"
                    class="size-10"
                  >
                    {member.nickname.slice(0, 2)}
                  </UserBadge>
                  <p class="uppercase">{member.nickname}</p>
                </div>
                <div class="flex items-center space-x-2">
                  <Show when={member.userId === session.user()?.id}>
                    <Dialog>
                      <DialogTrigger as={Button} variant="secondary" size="sm">
                        Edit
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle class="uppercase">
                            Update Nickname
                          </DialogTitle>
                          <DialogDescription class="lowercase">
                            this is how group members mention you
                          </DialogDescription>
                        </DialogHeader>
                        <div class="flex flex-col gap-4">
                          <TextFieldRoot>
                            <TextFieldLabel>nickname</TextFieldLabel>
                            <NicknameInput
                              class="w-full px-3 py-2 border bg-ui-muted focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
                              placeholder="Enter nickname"
                            />
                          </TextFieldRoot>

                          <Button
                            onClick={() =>
                              void updateNickname(member.id, nickname())
                            }
                            class="uppercase w-full"
                            size="sm"
                          >
                            Update
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </Show>

                  <Show when={member.userId === group()?.ownerId}>
                    <Badge variant="default">
                      <span class="uppercase">owner</span>
                    </Badge>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </StyledCardContent>
    </StyledCard>
  );
}
