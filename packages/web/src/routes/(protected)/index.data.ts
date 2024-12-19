import { toast } from '@/components/ui/toast';
import { api } from '@/lib/hono';
import {
  action,
  query,
  revalidate,
  useAction,
  useSubmission,
} from '@solidjs/router';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getGroups = query(async () => {
  const res = await api.users.$get();
  await sleep(2000);

  if (!res.ok) {
    throw new Error(`HTTP error! status`);
  }

  const data = await res.json();

  return data;
}, 'groups');

export const createGroupAction = action(
  async (
    title: string,
    numGroupsUserIsAMemberOf: number,
    close?: () => void,
  ) => {
    const res = await api.groups.$post({
      json: { body: { title: title, numGroupsUserIsAMemberOf } },
    });

    if (!res.ok) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
        variant: 'destructive' as const,
      });
    } else {
      await revalidate('groups'); // get rid of this when we can have time to add optimistic updates
      close?.();
      toast({
        title: 'Group Created!',
        description: `New group ${title} has been created.`,
        variant: 'default' as const,
      });
    }
  },
  'create-group',
);

export const useCreateGroup = () => {
  const submission = useSubmission(createGroupAction);
  return {
    raw: createGroupAction,
    ctx: submission,
    use: useAction(createGroupAction),
  };
};
