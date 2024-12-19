import { Group, TransactionWithPayeesWithMembers } from '@blank/core/db';

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

type GroupFetch = Group & {
  transactions: TransactionWithPayeesWithMembers[];
};

export const getGroup = query(async (groupId: string) => {
  // embed this in group data
  const resTransactions = await api.transactions.$get();

  // // TODO: update this function
  const resGroup = await api.groups[':id'].$get({
    param: { id: groupId },
  });

  if (!resTransactions.ok || !resGroup.ok) {
    throw new Error(`HTTP error! status`);
  }

  const group = await resGroup.json();
  const transaction = await resTransactions.json();

  const merged: GroupFetch = {
    ...group,
    transactions: transaction,
  };

  return merged;
}, 'transactions');

export const createTransactionAction = action(
  async (
    description: Accessor<string>,
    groupId?: string,
    close?: () => void,
  ) => {
    const res = await api.transactions.$post({
      json: {
        body: {
          type: 'natural_language',
          payload: {
            nl: description(),
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
  const submission = useSubmission(createTransactionAction);
  return {
    raw: createTransactionAction,
    ctx: {
      pendingFor: (input: string) =>
        submission.input?.[0]() === input && submission.pending,
      ...submission,
    },
    use: useAction(createTransactionAction),
  };
};

// export const updateTransactionAction = action(async function (
//   transaction: TransactionWithPayeesWithMembers,
//   form: UpdateableTransactionPartial,
//   close?: () => void,
// ) {
//   const check = form;
//   const diff = {} as UpdateableTransactionPartial & { id: string };

//   (Object.keys(check) as Array<keyof UpdateableTransactionPartial>).forEach(
//     (key) => {
//       // Only add to diff if the value has changed
//       if (check[key] !== transaction[key]) {
//         diff[key] = check[key];
//       }
//     },
//   );

//   if (Object.keys(diff).length === 0) {
//     toast({
//       title: 'No changes made.',
//       description: 'There were no updates entered.',
//       variant: 'neutral' as const,
//     });
//     close?.();
//   } else {
//     const payload = {
//       ...diff,
//       id: transaction.id,
//     };

//     const res = await api.transactions.$patch({
//       json: { body: payload },
//     });

//     if (!res.ok) {
//       toast({
//         title: 'Uh oh! Something went wrong.',
//         description: 'There was a problem with your request.',
//         variant: 'destructive' as const,
//       });
//     } else {
//       await revalidate('transactions'); // get rid of this when we can have time to add optimistic updates
//       close?.();
//       toast({
//         title: 'Transaction updated!',
//         description: 'Your transaction has been updated.',
//         variant: 'default' as const,
//       });
//     }
//   }
// });

// export const useUpdateTransaction = () => {
//   const submission = useSubmission(updateTransactionAction);
//   return {
//     raw: updateTransactionAction,
//     ctx: {
//       ...submission,
//       pendingFor: (input: Transaction) =>
//         submission.input?.[0] === input && submission.pending,
//     },
//     use: useAction(updateTransactionAction),
//   };
// };

export const deleteTransactionsAction = action(async function (
  deleteIds: string[],
  resetRows?: () => void,
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
