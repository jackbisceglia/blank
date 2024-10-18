import {
  For,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
  startTransition,
} from "solid-js";

import { Transaction } from "@blank/core/db";
import { api } from "~/lib/hono";

const getTransactions = async () => {
  const res = await api.transactions.$get();
  console.log(res);

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();

  return data;
};

export default function HomePage() {
  const [transactions, { mutate, refetch }] = createResource(getTransactions);

  async function optimistic(item: Transaction) {
    const alreadyInUI = transactions() ?? [];

    mutate([item, ...alreadyInUI]);

    return await startTransition(async () => {
      await refetch();
    });
  }

  const createRandomTransaction = async () => {
    const res = await api.transactions.random.$post();

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const random = await res.json();

    optimistic(random[0]);

    return random;
  };

  return (
    <main class="text-center mx-auto text-gray-300 p-4 flex flex-col items-center gap-2">
      <h1 class="text-6xl text-sky-700 font-thin uppercase my-3">blank</h1>
      <button
        class="w-[200px] disabled:bg-gray-400 disabled:border-gray-400 rounded-full my-3 text-gray-950 bg-gray-100 border-2 border-gray-300 focus:border-gray-400 active:border-gray-400 px-[2rem] py-[1rem]"
        onClick={createRandomTransaction}
        disabled={transactions.loading}
      >
        Create Random
      </button>
      <Suspense fallback={<p>Loading...</p>}>
        <Show
          when={!!transactions()?.length}
          fallback={<p>No transactions yet . . . </p>}
        >
          <For each={transactions()}>
            {(transaction) => (
              <div class="border p-4 rounded-lg mx-auto w-full max-w-screen-md">
                <p>
                  <strong>Description:</strong> {transaction.description}
                </p>
                <p>
                  <strong>Amount:</strong> $
                  {(transaction.amount / 100).toFixed(2)}
                </p>
                <p>
                  <strong>Date:</strong> {transaction.date}
                </p>
                <p>
                  <strong>ID:</strong> {transaction.id}
                </p>
              </div>
            )}
          </For>
        </Show>
      </Suspense>
    </main>
  );
}
