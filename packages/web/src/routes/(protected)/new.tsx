import { api } from '@/lib/hono';
import { revalidate, useNavigate } from '@solidjs/router';
import { onMount } from 'solid-js';
import { DOMElement } from 'solid-js/jsx-runtime';

const inputName = 'transaction-name';

const mutateStrategies = {
  redirect: 'redirect',
  stay: 'stay',
} as const;

type FormSubmitterDataAttrs = {
  createStrategy: (typeof mutateStrategies)[keyof typeof mutateStrategies];
};

export default function NewPage() {
  const navigate = useNavigate();
  let inputRef: HTMLInputElement | undefined;

  async function handleCreateNaturalLangaugeTransaction(
    e: SubmitEvent & {
      currentTarget: HTMLFormElement;
      target: DOMElement;
    },
  ) {
    function cleanup() {
      void revalidate('transactions');
      form.reset();

      if (shouldRedirect()) {
        navigate('/');
      }
    }

    function shouldRedirect() {
      const dataset = e.submitter?.dataset as FormSubmitterDataAttrs;

      return dataset.createStrategy === mutateStrategies.redirect;
    }

    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const nl = formData.get(inputName) as string;

    // can prefix with "<number>x" to insert multiple transactions
    const words = nl.split(' ');
    const DEV_MODE_NUM_INSERTS =
      words.at(0)?.includes('x') && import.meta.env.DEV
        ? parseInt(words.at(0)?.replace('x', '') ?? '1')
        : 1;

    const payload = DEV_MODE_NUM_INSERTS > 1 ? words.slice(1).join(' ') : nl;

    const res = await api.transactions.$post({
      json: {
        body: {
          type: 'natural_language',
          payload: payload,
        },
      },
    });

    if (DEV_MODE_NUM_INSERTS && DEV_MODE_NUM_INSERTS > 1) {
      const augmentNL = (suffix: string) =>
        `${payload.split(' ').at(0) ?? ''}${suffix} ${payload.split(' ').slice(1).join(' ')}`;

      console.log('dev: ', DEV_MODE_NUM_INSERTS);

      const promises: Promise<unknown>[] = [];
      for (let i = 0; i < DEV_MODE_NUM_INSERTS; i++) {
        const suffix = Math.random().toString(36).substring(3, 5);
        const payload = augmentNL(suffix);

        promises.push(
          api.transactions.$post({
            json: {
              body: {
                type: 'natural_language',
                payload: payload,
              },
            },
          }),
        );
      }

      await Promise.allSettled(promises);
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status.toString()}`);
    }

    cleanup();
  }
  onMount(() => {
    inputRef?.focus();
  });

  return (
    <>
      <h1 class="max-6-xs text-4xl font-light my-8 lowercase">
        Splitting something?
      </h1>
      <form
        class="w-full max-w-xl mx-auto mt-4 rounded-lg p-6"
        onSubmit={(e) => void handleCreateNaturalLangaugeTransaction(e)}
      >
        <div class="mb-4 text-left">
          <label
            for={inputName}
            class="lowercase block text-sm font-medium text-gray-300 mb-2"
          >
            Transaction Description
          </label>
          <input
            ref={inputRef}
            type="text"
            name={inputName}
            id="transaction-name"
            class="w-full px-3 py-2 border border-gray-500 rounded-md bg-ui-background focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
            placeholder="coffee, $18, split with..."
          />
        </div>
        <div class="w-full font-normal flex flex-col gap-3 text-xs  ">
          <button
            type="submit"
            data-create-strategy={mutateStrategies.redirect}
            class="uppercase w-full bg-muted text-white font-medium py-2 px-4 rounded-md hover:bg-ui-background focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            Create
          </button>
          <button
            type="submit"
            data-create-strategy={mutateStrategies.stay}
            class="uppercase w-full bg-muted text-white font-medium py-2 px-4 rounded-md hover:bg-ui-background focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            Create & New
          </button>
        </div>
      </form>
    </>
  );
}
