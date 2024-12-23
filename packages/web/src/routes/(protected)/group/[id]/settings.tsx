import { GroupParams } from '.';
import { deleteGroup, updateGroup } from '../../index.data';
import { getGroupDetails } from './index.data';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TextFieldLabel, TextFieldRoot } from '@/components/ui/textfield';
import { cn } from '@/lib/cn';
import { createSignalBoundTextField, formPrevent } from '@/lib/util.client';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { useNavigate, useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { ParentComponent, Show } from 'solid-js';
import { DOMElement } from 'solid-js/jsx-runtime';

const StyledCard: ParentComponent<{ class?: string }> = (props) => (
  <Card
    class={cn('text-left flex h-full flex-col justify-start', props.class)}
    {...props}
  />
);
const StyledCardHeader: ParentComponent = (props) => <CardHeader {...props} />;
const StyledCardTitle: ParentComponent = (props) => (
  <CardTitle class="uppercase text-lg" {...props} />
);
const StyledCardDescription: ParentComponent = (props) => (
  <CardDescription class="lowercase" {...props} />
);
const StyledCardContent: ParentComponent<{ class?: string }> = (props) => (
  <CardContent class={cn(props.class, 'p-0 px-6 mb-auto')} {...props} />
);
const StyledCardFooter: ParentComponent = (props) => (
  <CardFooter class="p-6 px-6" {...props} />
);

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

function AddMembersSection() {
  const [[inviteEmail, setInviteEmail], InviteEmailInput] =
    createSignalBoundTextField<string>('');

  const [[inviteLink, setInviteLink], InviteLinkInput] =
    createSignalBoundTextField<string>('');

  const handleGenerateInviteLink = () => {
    // Implement invite link generation logic here
    const newLink = `https://yourapp.com/invite/${Math.random().toString(36).substring(2, 9)}`;
    setInviteLink(newLink);
  };
  const handleInviteByEmail = (
    e: SubmitEvent & {
      currentTarget: HTMLFormElement;
      target: DOMElement;
    },
  ) => {
    e.preventDefault();
    // Implement email invitation logic here
    console.log(`Invitation sent to ${inviteEmail()}`);
    setInviteEmail('');
  };

  return (
    <StyledCard>
      <StyledCardHeader>
        <StyledCardTitle>Invite Members</StyledCardTitle>
        <StyledCardDescription>
          {' '}
          add new members to your group{' '}
        </StyledCardDescription>
      </StyledCardHeader>
      <StyledCardContent class="pb-6 space-y-6">
        <form class="space-y-3">
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
        </form>

        <form class="space-y-3">
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
              >
                Copy
              </Button>
            </div>
          </TextFieldRoot>
          <Button class="uppercase w-full" size="sm">
            Generate
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
  const params = useParams<GroupParams>();
  const group = useQuery(() => getGroupDetails(z, params.id));
  const session = useUser();

  function handleDeleteSubmission(confirmation: string) {
    const g = group();
    const user = session.user();

    if (!g || !user) return;
    if (confirmation !== group()?.title) {
      // TODO: toast
      window.alert("these don't match");
      return;
    }

    void deleteGroup(z, g.id, g.ownerId, user.id);
    navigate('/');
  }

  function handleUpdateGroupDetails(newGroupName: string) {
    const g = group();
    const user = session.user();

    if (!g || !user) return;

    void updateGroup(z, g.id, g.ownerId, user.id, newGroupName);
  }

  return (
    <Show when={session.user() && group()}>
      {(group) => (
        <div class="grid grid-cols-2 gap-4 py-1">
          <DetailsSection
            update={handleUpdateGroupDetails}
            groupName={group().title}
          />
          <DangerZoneSection delete={handleDeleteSubmission} />
          <AddMembersSection />
        </div>
      )}
    </Show>
  );
}
