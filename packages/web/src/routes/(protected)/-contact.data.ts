import { unformatPhoneNumber } from './contacts';

import { toast } from '@/components/ui/toast';
import { api } from '@/lib/hono';
import { action, revalidate, useAction, useSubmission } from '@solidjs/router';

export const createContactAction = action(
  async (name: string, number: string, close?: () => void) => {
    const res = await api.contacts.$post({
      json: {
        body: {
          name,
          phone: unformatPhoneNumber(number),
        },
      },
    });

    if (!res.ok) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
        variant: 'destructive' as const,
      });
    } else {
      await revalidate('contacts');
      close?.();
      toast({
        title: 'Contact created!',
        description: 'Your contact has been created.',
        variant: 'default' as const,
      });
    }
  },
  'create-contact',
);

export const useCreateContact = () => {
  return {
    raw: createContactAction,
    ctx: useSubmission(createContactAction),
    use: useAction(createContactAction),
  };
};

export const deleteContactAction = action(async function (deleteId: string) {
  const res = await api.contacts[':id'].$delete({ param: { id: deleteId } });

  if (!res.ok) {
    toast({
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem deleting the contact.',
      variant: 'destructive' as const,
    });
  } else {
    toast({
      title: 'Contact Deleted',
      description: 'contact has been deleted!',
      variant: 'default' as const,
    });
  }
}, 'delete-contact');

export const useDeleteContact = () => {
  const submission = useSubmission(deleteContactAction);
  return {
    raw: deleteContactAction,
    ctx: {
      ...submission,
      pendingFor: (input: string) =>
        submission.input?.[0] === input && submission.pending,
    },
    use: useAction(deleteContactAction),
  };
};
