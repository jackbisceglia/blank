// import { Group, TransactionWithPayeesWithMembers } from '@blank/core/db';

import { toast } from '@/components/ui/toast';
import { api } from '@/lib/hono';
import { Zero } from '@/lib/zero';
import {
  action,
  // query,
  revalidate,
  useAction,
  useSubmission,
} from '@solidjs/router';
import { startTransition } from 'solid-js';

export function getGroupDetails(z: Zero, groupId: string, userId: string) {
  return z.query.group
    .where('id', '=', groupId)
    .whereExists('members', (m) => m.where('userId', userId))
    .one()
    .related('members')
    .related('transactions', (q) =>
      q.related('transactionMembers', (q) => q.related('members').one()),
    );
}

export const createTransactionAction = action(
  async (description: string, groupId?: string, close?: () => void) => {
    toast({
      title: 'Processing Transaction...',
      description: "We'll notify you when it's been parsed.",
      variant: 'neutral' as const,
    });

    close?.();

    const res = await api.transactions.$post({
      json: {
        body: {
          type: 'natural_language' as const,
          payload: {
            nl: description,
            groupId,
          },
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
      await revalidate('transactions'); // get rid of this when we can have time to add optimistic updates
      toast({
        title: 'Transaction created!',
        description: 'Your transaction has been created.',
        variant: 'default' as const,
      });
    }
  },
  'create-transaction',
);

export const useCreateTransaction = () => {
  const submission = useSubmission(createTransactionAction);
  return {
    raw: createTransactionAction,
    ctx: submission,
    use: useAction(createTransactionAction),
  };
};

// TODO: get rid of this guy and replace with zero
export const deleteTransactionsAction = action(async function (
  deleteIds: {
    transactionId: string;
    groupId: string;
  }[],
  resetRows?: () => void,
) {
  const res = await api.transactions.$delete({
    json: {
      body: { ids: deleteIds },
    },
  });

  if (!res.ok) {
    toast({
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem deleting transaction(s).',
      variant: 'destructive' as const,
    });
  } else {
    const resources = await res.json();
    const plural = resources.length > 1;

    await startTransition(() => {
      void revalidate('transactions');
      resetRows?.();
      toast({
        title: plural ? 'Transactions Deleted' : 'Transaction Deleted',
        description: plural
          ? `${resources.length.toString()} transactions have been deleted!`
          : `1 transaction has been deleted!`,
        variant: 'default' as const,
      });
    });
    await Promise.resolve().then();
  }
}, 'delete-transactions');

export const useDeleteTransactions = () => {
  return {
    raw: deleteTransactionsAction,
    ctx: useSubmission(deleteTransactionsAction),
    use: useAction(deleteTransactionsAction),
  };
};

export async function deleteTransaction(z: Zero, transactionId: string) {
  // TODO: cascade
  await z.mutate.transaction.delete({
    id: transactionId,
  });
}

export async function deleteTransactions(z: Zero, transactionIds: string[]) {
  // TODO: cascade
  await z.mutateBatch(async (tx) => {
    for (const transactionId of transactionIds) {
      await tx.transaction.delete({
        id: transactionId,
      });
    }
  });
}

// will only work if you have jane/john doe in your contacts
const devOnlySeedTransactions = action(async () => {
  const defaultNLTransactions = [
    'LocalMart w/ John Doe, $62',
    'Dinner with Jane Doe, $67',
    'Celtics tickets with John Doe, $100',
    'Got Annie a haircut, split with Jane Doe, $71',
    'Split beans and coffee with Jane Doe, $29',
    'Internet for January, $110. Me and Jane Doe.',
    'Grocery store this week cost 67. Split with John Doe.',
    'Movie tickets on Saturday with Jane Doe, $30',
    'Cleaning supplies at store with John Doe $22',
    'Split coffee with Jane Doe, $18',
    'Between John Doe and I, that dinner came to $85',
  ];

  await Promise.all(
    defaultNLTransactions.map((sentence) => {
      void api.transactions.$post({
        json: {
          body: {
            type: 'natural_language',
            payload: {
              nl: sentence,
            },
          },
        },
      });
    }),
  );
}, 'dev-only-seed-transactions');

export const useDevOnlySeedTransactions = () => {
  return {
    raw: devOnlySeedTransactions,
    ctx: useSubmission(devOnlySeedTransactions),
    use: useAction(devOnlySeedTransactions),
  };
};
