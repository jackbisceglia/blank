import { GroupParams } from '.';
import {
  deleteGroup,
  generateGroupInviteLink,
  updateGroup,
} from '../../index.data';
import {
  StyledCard,
  StyledCardContent,
  StyledCardDescription,
  StyledCardFooter,
  StyledCardHeader,
  StyledCardTitle,
} from './+styled-card';
import { getGroupDetails } from './index.data';

import { Button } from '@/components/ui/button';
import { TextFieldLabel, TextFieldRoot } from '@/components/ui/textfield';
import { toast } from '@/components/ui/toast';
import { createSignalBoundTextField, formPrevent } from '@/lib/util.client';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { useLocation, useNavigate, useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { Show } from 'solid-js';

interface DetailsSectionProps {
  groupName: string;
  update: (newGroupName: string) => void;
}

function DetailsSection(props: DetailsSectionProps) {
  // const  = createSignal(props.groupName);
  const [[groupName], GroupInput] = createSignalBoundTextField<string>(
    props.groupName,
  );

  return (
    <form
      class="h-full"
      onSubmit={formPrevent(() => {
        props.update(groupName());
      })}
    >
      <StyledCard>
        <StyledCardHeader>
          <StyledCardTitle>Group Details</StyledCardTitle>
          <StyledCardDescription>
            manage your group&apos;s basic information
          </StyledCardDescription>
        </StyledCardHeader>
        <StyledCardContent>
          <TextFieldRoot class="w-full text-left">
            <TextFieldLabel for="groupName" class="lowercase">
              group name
            </TextFieldLabel>
            <GroupInput
              id="groupName"
              placeholder={props.groupName}
              class="lowercase w-full text-ui-foreground"
            />
          </TextFieldRoot>
        </StyledCardContent>
        <StyledCardFooter>
          <Button
            disabled={groupName() === props.groupName}
            type="submit"
            class="uppercase w-full"
            size="sm"
          >
            save changes
          </Button>
        </StyledCardFooter>
      </StyledCard>
    </form>
  );
}

interface AddMembersSectionProps {
  groupId: string;
  inviteLink: string | null;
  generateLink: () => void;
}

function AddMembersSection(props: AddMembersSectionProps) {
  // const [, InviteEmailInput] = createSignalBoundTextField<string>('');

  const [[inviteLink], InviteLinkInput] = createSignalBoundTextField<
    string | null
  >(props.inviteLink);

  // const handleInviteByEmail = (
  //   e: SubmitEvent & {
  //     currentTarget: HTMLFormElement;
  //     target: DOMElement;
  //   },
  // ) => {
  //   e.preventDefault();
  //   // Implement email invitation logic here
  //   console.log(`Invitation sent to ${inviteEmail()}`);
  //   setInviteEmail('');
  // };

  const handleCopyInvitationLink = async () => {
    const link = inviteLink();
    if (!link) return;

    await navigator.clipboard.writeText(link);
    toast({
      title: 'Invitation Link Copied',
      description: 'The invitation link has been copied to your clipboard.',
      variant: 'default' as const,
    });
  };

  return (
    <StyledCard class="flex flex-col justify-between text-left">
      <StyledCardHeader>
        <StyledCardTitle>Invite Members</StyledCardTitle>
        <StyledCardDescription>
          {' '}
          add new members to your group{' '}
        </StyledCardDescription>
      </StyledCardHeader>
      <StyledCardContent class="pb-6 space-y-6">
        {/* <form class="space-y-3">
          <TextFieldRoot class="w-full text-left space-x-0">
            <TextFieldLabel for="groupName" class="lowercase">
              Invite By Email
            </TextFieldLabel>
            <InviteEmailInput
              id="groupName"
              placeholder="foo@bar.com"
              class="lowercase w-full text-ui-foreground"
            />
          </TextFieldRoot>
          <Button class="uppercase w-full" size="sm">
            Send Invitation
          </Button>
        </form> */}

        <form
          onSubmit={formPrevent(() => {
            console.log('clicked?');
            props.generateLink();
          })}
          class="space-y-6"
        >
          <TextFieldRoot class="w-full text-left space-x-0">
            <TextFieldLabel for="groupName" class="lowercase">
              Generate Invite Link
            </TextFieldLabel>
            <div class="flex items-center gap-3">
              <InviteLinkInput
                readOnly
                placeholder="generated invite link will appear here"
                id="groupName"
                class="lowercase w-full text-ui-foreground"
              />
              <Button
                class="uppercase w-fit hover:bg-ui-secondary"
                variant="ghost"
                size="sm"
                onClick={() => void handleCopyInvitationLink()}
                disabled={!inviteLink()}
              >
                Copy
              </Button>
            </div>
          </TextFieldRoot>
          <Button type="submit" class="uppercase w-full" size="sm">
            <Show when={inviteLink()} fallback="Generate Link">
              Generate New Link
            </Show>
          </Button>
        </form>
      </StyledCardContent>
    </StyledCard>
  );
}

interface DangerZoneSectionProps {
  delete: (confirmation: string) => void;
}

function DangerZoneSection(props: DangerZoneSectionProps) {
  const [[groupNameConfirmation], GroupNameConfirmationInput] =
    createSignalBoundTextField<string>('');

  return (
    <StyledCard>
      <StyledCardHeader>
        <StyledCardTitle>Danger Zone</StyledCardTitle>
        <StyledCardDescription>
          irreversible actions for your group
        </StyledCardDescription>
      </StyledCardHeader>
      <StyledCardContent class="pb-6 space-y-6">
        <form
          class="space-y-3"
          onSubmit={formPrevent(() => {
            props.delete(groupNameConfirmation());
          })}
        >
          <TextFieldRoot class="w-full text-left space-x-0">
            <TextFieldLabel for="groupName" class="lowercase">
              Enter group name to confirm
            </TextFieldLabel>
            <GroupNameConfirmationInput
              id="groupName"
              placeholder="danger"
              class="lowercase w-full text-ui-foreground"
            />
          </TextFieldRoot>
          <Button
            type="submit"
            class="uppercase w-full"
            variant="destructive"
            size="sm"
          >
            Delete
          </Button>
        </form>
      </StyledCardContent>
    </StyledCard>
  );
}

export default function GroupSettingsPage() {
  const z = useZero();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<GroupParams>();
  const session = useUser();
  const group = useQuery(() =>
    getGroupDetails(z, params.id, session.user()?.id ?? ''),
  );

  function handleDeleteSubmission(confirmation: string) {
    const g = group();
    const user = session.user();

    if (!g || !user) return;

    if (confirmation !== group()?.title) {
      // TODO: toast
      toast({
        title: 'Incorrect confirmation',
        description:
          'The group names did not match. Try again, this can not be undone.',
        variant: 'destructive' as const,
      });
    } else {
      toast({
        title: 'Group Deleted',
        description: `Group ${confirmation} successfully deleted`,
        variant: 'default' as const,
      });
      void deleteGroup(z, g.id, g.ownerId, user.id);
      navigate('/');
    }
  }

  function handleUpdateGroupDetails(newGroupName: string) {
    const property = 'name'; // TODO: we can update this when more details are update-able
    const g = group();
    const user = session.user();

    if (!g || !user) return;

    void updateGroup(z, g.id, g.ownerId, user.id, newGroupName);
    toast({
      title: `Group ${property} Updated`,
      description: `Group successfully renamed to "${newGroupName}".`,
      variant: 'default' as const,
    });
  }

  function handleGenerateInviteLink() {
    const g = group();
    const user = session.user();

    if (!g || !user) return;

    void generateGroupInviteLink(z, g.id);
  }

  const inviteLink = () => {
    const g = group();
    const user = session.user();

    if (!g || !user || !g.invitationId) return null;

    console.log(location);
    return `http://localhost:3000/group/join/${g.invitationId}`; // TODO: fix this
  };

  return (
    <Show when={session.user() && group()}>
      {(group) => (
        <div class="grid grid-cols-2 gap-4">
          <DetailsSection
            update={handleUpdateGroupDetails}
            groupName={group().title}
          />
          <AddMembersSection
            groupId={group().id}
            inviteLink={inviteLink()}
            generateLink={handleGenerateInviteLink}
          />
          <DangerZoneSection delete={handleDeleteSubmission} />
        </div>
      )}
    </Show>
  );
}
