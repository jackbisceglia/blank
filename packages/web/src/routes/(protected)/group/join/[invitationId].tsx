import {
  StyledCard,
  StyledCardContent,
  StyledCardDescription,
  StyledCardHeader,
  StyledCardTitle,
} from '../[id]/+styled-card';
import {
  getGroupMembersWhereUserIsAMember,
  getTopLevelGroupDetailsByInviteLink,
  joinGroup,
} from './[invitationId].data';

import { Button } from '@/components/ui/button';
import { formPrevent } from '@/lib/util.client';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { A, useBeforeLeave, useNavigate, useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { Show, Suspense, createEffect, startTransition } from 'solid-js';

type Params = { invitationId: string };

export default function JoinGroupPage() {
  const session = useUser();
  const z = useZero();
  const navigate = useNavigate();
  const params = useParams<Params>();
  const group = useQuery(() =>
    getTopLevelGroupDetailsByInviteLink(z, params.invitationId),
  );
  const guardedGroupWithMembers = useQuery(() =>
    getGroupMembersWhereUserIsAMember(
      z,
      group()?.id ?? '',
      session.user()?.id ?? '',
    ),
  );

  const isMember = () => guardedGroupWithMembers() !== undefined;

  const handleJoinGroup = () => {
    const g = group();
    const user = session.user();
    if (!g || !user || !user.username || isMember()) return;

    // TODO: fix new state flash
    void startTransition(() => {
      joinGroup(z, group()?.id ?? '', user.id, user.username ?? '');
      navigate(`/group/${g.id}`);
    });
    // console.log('nav');
  };

  return (
    <Suspense>
      <Show when={session.user() && group()}>
        {(group) => (
          <form
            onSubmit={formPrevent(handleJoinGroup)}
            class="flex h-full items-center justify-center text-left"
          >
            <StyledCard class="max-w-md w-full">
              <StyledCardHeader>
                <StyledCardTitle>
                  <Show when={!isMember()} fallback={"Can't join "}>
                    Join{' '}
                  </Show>
                  '{group().title}'
                </StyledCardTitle>
                <StyledCardDescription>
                  <Show
                    when={!isMember()}
                    fallback={"you're already a member of"}
                  >
                    you&apos;ve been invited to join
                  </Show>{' '}
                  '{group().title}'
                </StyledCardDescription>
              </StyledCardHeader>
              <StyledCardContent class="flex justify-center">
                <Show
                  when={!isMember()}
                  fallback={
                    <Button
                      as={A}
                      href={`/group/${group().id}`}
                      disabled={!isMember()}
                      type="button"
                      class="uppercase w-full"
                      size="sm"
                    >
                      Go Back
                    </Button>
                  }
                >
                  <Button
                    disabled={isMember()}
                    type="submit"
                    class="uppercase w-full"
                    size="sm"
                  >
                    Join Now
                  </Button>
                </Show>
              </StyledCardContent>
            </StyledCard>
          </form>
        )}
      </Show>
    </Suspense>
  );
}
