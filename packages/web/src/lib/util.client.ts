import { JSX } from 'solid-js';

export type WithChildren<T extends object = object> = {
  children: JSX.Element;
} & T;

// copy to clipboard as string
async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

export const clipboard = {
  copy,
};

/* 
- use<CRUD><ACTION>
- can't figure out types on making this an abstraction, will just copy/paste this for now

const useCreateTransaction = () => {
  return {
    raw: createTransactionAction,
    ctx: useSubmission(createTransactionAction),
    use: useAction(createTransactionAction),
  };
};

*/
