import { toast } from '@/components/ui/toast';
import { api } from '@/lib/hono';
import {
  action,
  query,
  revalidate,
  useAction,
  useSubmission,
} from '@solidjs/router';
import { Accessor, startTransition } from 'solid-js';

export const getTransactions = query(async () => {
  const res = await api.transactions.$get();

  if (!res.ok) {
    throw new Error(`HTTP error! status`);
  }

  const data = await res.json();

  return data;
}, 'transactions');

export const createTransactionAction = action(
  async (description: Accessor<string>, close?: () => void) => {
    const res = await api.transactions.$post({
      json: {
        body: {
          type: 'natural_language',
          payload: description(),
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
      // await revalidate('transactions');
      close?.();
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
  return {
    raw: createTransactionAction,
    ctx: useSubmission(createTransactionAction),
    use: useAction(createTransactionAction),
  };
};

export const deleteTransactionsAction = action(async function (
  deleteIds: string[],
  resetRows: () => void,
) {
  const res = await api.transactions.$delete({
    json: { body: { ids: deleteIds } },
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
      resetRows();
      void revalidate('transactions');
      toast({
        title: plural ? 'Transactions Deleted' : 'Transaction Deleted',
        description: plural
          ? `${resources.length.toString()} transactions have been deleted!`
          : `1 transaction has been deleted!`,
        variant: 'default' as const,
      });
    });
  }
}, 'delete-transactions');

export const useDeleteTransactions = () => {
  return {
    raw: deleteTransactionsAction,
    ctx: useSubmission(deleteTransactionsAction),
    use: useAction(deleteTransactionsAction),
  };
};
