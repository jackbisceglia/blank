import { TextField, textFieldInputProps } from '@/components/ui/textfield';
import { PolymorphicProps } from '@kobalte/core';
import { Accessor, JSX, Setter, ValidComponent, createSignal } from 'solid-js';

export type WithChildren<T extends object = object> = {
  children: JSX.Element;
} & T;

// copy to clipboard as string
async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

export const createSignalBoundTextField = <
  T extends string | number | string[] | undefined,
>(
  defaultValue: T,
) => {
  const [signal, setSignal] = createSignal<T>(defaultValue);

  return [
    [signal, setSignal] as const as [Accessor<T>, Setter<T>],
    <U extends ValidComponent = 'input'>(
      props: PolymorphicProps<U, textFieldInputProps<U>>,
    ) => {
      return (
        <TextField
          {...props}
          value={signal()}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          onInput={(e) => setSignal(e.currentTarget?.value)}
        />
      );
    },
  ] as const;
};

export const clipboard = {
  copy,
};

export const formPrevent = (fn: () => void) => (e: Event) => {
  e.preventDefault();
  fn();
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
