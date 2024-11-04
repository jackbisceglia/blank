import { api } from '~/lib/hono';

import { type TransactionWithPayees } from '@blank/core/db';

import { createAsync, query, revalidate } from '@solidjs/router';
import { useAuth } from 'clerk-solidjs';
import {
  createEffect,
  createSignal,
  ErrorBoundary,
  For,
  Show,
  Suspense,
} from 'solid-js';

const SkeletonCard = () => (
  <div class="border border-neutral-700 p-6 h-60 rounded-lg mx-auto w-full max-w-screen-md bg-neutral-800 shadow-md animate-pulse">
    <div class="flex justify-between mb-2">
      <span class="font-medium text-neutral-300 bg-neutral-700 rounded h-4 w-24" />
      <span class="text-neutral-400 bg-neutral-700 rounded h-4 w-32" />
    </div>
    <div class="flex justify-between mb-2">
      <span class="font-medium text-neutral-300 bg-neutral-700 rounded h-4 w-16" />
      <span class="text-neutral-400 bg-neutral-700 rounded h-4 w-48" />
    </div>
    <div class="flex justify-between mb-2">
      <span class="font-medium text-neutral-300 bg-neutral-700 rounded h-4 w-16" />
      <span class="text-neutral-400 bg-neutral-700 rounded h-4 w-16" />
    </div>
    <div class="flex justify-between mb-2">
      <span class="font-medium text-neutral-300 bg-neutral-700 rounded h-4 w-12" />
      <span class="text-neutral-400 bg-neutral-700 rounded h-4 w-24" />
    </div>
    <div class="flex justify-between mb-2">
      <span class="font-medium text-neutral-300 bg-neutral-700 rounded h-4 w-8" />
      <span class="text-neutral-400 bg-neutral-700 rounded h-4 w-32" />
    </div>
    <div class="flex justify-between mb-2">
      <span class="bg-neutral-700 rounded h-8 w-full" />
    </div>
  </div>
);

const HandleError = (props: { error: Error | null }) => {
  const [error, setError] = createSignal<Error | null>(null);

  // Log the error
  createEffect(() => {
    if (props.error) {
      console.error('Error caught in ErrorBoundary:', props.error);
      setError(props.error);
    }
  });

  return (
    <div>
      <p>An error occurred:</p>
      <Show when={error()}>{(error) => <pre>{error().toString()}</pre>}</Show>
    </div>
  );
};

const getTransactions = query(async () => {
  const res = await api.transactions.$get();

  if (!res.ok) {
    throw new Error(`HTTP error! status`);
  }

  const data = await res.json();
  console.log('running');

  return data;
}, 'transactions');

export default function HomePage() {
  const auth = useAuth();
  const transactions = createAsync(() => getTransactions());
  const mutate = (optimistic: TransactionWithPayees[]) => {
    query.set('transactions', optimistic);
    void revalidate();
  };

  async function deleteTransaction(id: string) {
    try {
      mutate((transactions() ?? []).filter((t) => t.id !== id));

      const res = await api.transactions[':id'].$delete({ param: { id } });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status.toString()}`);
      }

      await res.json();

      void revalidate();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <ErrorBoundary fallback={(e) => <HandleError error={e as Error} />}>
      <div class="grid grid-cols-2 gap-4 mt-4">
        <Suspense
          fallback={<For each={[0, 1, 2, 3]}>{() => <SkeletonCard />}</For>}
        >
          <Show
            when={!!transactions()?.length && auth.getToken()}
            fallback={<p>No transactions yet . . . </p>}
          >
            <For each={transactions()}>
              {(transaction) => (
                <div class="border border-neutral-700 p-6 rounded-lg mx-auto w-full max-w-screen-md bg-neutral-800 shadow-md">
                  <div class="flex justify-between mb-2">
                    <span class="font-medium text-neutral-300">
                      Description:
                    </span>
                    <span class="text-neutral-400">
                      {transaction.description}
                    </span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="font-medium text-neutral-300">With:</span>
                    <span class="text-neutral-400">
                      {transaction.payees.map((p) => p.payeeId).join(', ')}
                    </span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="font-medium text-neutral-300">Amount:</span>
                    <span class="text-neutral-400">
                      ${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="font-medium text-neutral-300">Date:</span>
                    <span class="text-neutral-400">{transaction.date}</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="font-medium text-neutral-300">ID:</span>
                    <span class="text-neutral-400">{transaction.id}</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <button
                      class="w-full bg-neutral-600 text-white font-medium py-2 px-4 text-xs rounded-md hover:bg-neutral-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      onClick={() => void deleteTransaction(transaction.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
