import {
  StyledCard,
  StyledCardContent,
  StyledCardDescription,
  StyledCardHeader,
  StyledCardTitle,
} from '../[id]/+styled-card';
import {
  getGroupByInvitationId,
  getUserIsMemberByInvitationId,
  joinGroup,
} from './[invitationId].data';

import { Button } from '@/components/ui/button';
import { formPrevent } from '@/lib/util.client';
import { Zero, useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { A, useNavigate, useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { Show, batch, createMemo } from 'solid-js';

type Params = { invitationId: string };

const useIsMember = (z: Zero, invitationId: string, userId: string) => {
  const isMember = useQuery(() =>
    getUserIsMemberByInvitationId(z, invitationId, userId),
  );

  return () => isMember().length !== 0;
};

export default function JoinGroupPage() {
  const session = useUser();
  const z = useZero();
  const navigate = useNavigate();
  const params = useParams<Params>();

  const isMember = useIsMember(
    z,
    params.invitationId,
    session.user()?.id ?? '',
  );

  const groups = useQuery(() => getGroupByInvitationId(z, params.invitationId));

  const group = createMemo(() => groups()[0]);

  const handleJoinGroup = () => {
    const user = session.user();

    if (!user?.username || isMember()) return;

    batch(() => {
      joinGroup(z, group().id, user.id, user.username ?? '');
      navigate(`/group/${group().id}`);
    });
  };

  return (
    <Show when={session.user()}>
      <Show when={group()}>
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
    </Show>
  );
}
