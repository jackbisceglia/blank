import { useCreateTransaction } from './index.data';

import { Button, ButtonLoadable } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TextField,
  TextFieldLabel,
  TextFieldRoot,
} from '@/components/ui/textfield';
import { action, useAction, useSearchParams } from '@solidjs/router';
import {
  ParentComponent,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from 'solid-js';

export type DialogState = 'open' | 'closed';

// note: this is an action we invoke globally- as such, we export everything needed to use it globally (context, etc)
function useDialogState() {
  const [searchParams, setSearchParams] = useSearchParams<{
    action?: 'new-transaction';
  }>();

  const state = createMemo<DialogState>(() =>
    searchParams.action === 'new-transaction' ? 'open' : 'closed',
  );

  const open = () => {
    setSearchParams({ action: 'new-transaction' });
  };

  const close = (onClose?: () => void) => {
    onClose?.();
    setSearchParams({ ...searchParams, action: undefined });
  };

  const toggle = () => {
    (state() === 'open' ? close : open)();
  };

  const context = {
    state,
    open,
    close,
    toggle,
  };

  return context;
}

const DialogContext = createContext<ReturnType<typeof useDialogState>>();

export const DialogProvider: ParentComponent = (props) => {
  const value = useDialogState();
  return (
    <DialogContext.Provider value={value}>
      {props.children}
    </DialogContext.Provider>
  );
};

export function useNewTransactionDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error(`useDialog must be used within a DialogProvider`);
  }
  return context;
}

export const NewTransactionDialog = () => {
  const { state, close, open } = useNewTransactionDialog();

  const create = useCreateTransaction();
  const [transactionDescription, setTransactionDescription] = createSignal('');

  const cleanupForm = () => {
    setTransactionDescription('');
  };

  const onOpenChange = () => {
    if (state() === 'open') {
      close(cleanupForm);
    } else {
      open();
    }
  };

  const createAndNew = useAction(
    action(async () => {
      await create.use(transactionDescription, undefined, cleanupForm);
      await Promise.resolve();

      return;
    }, 'create-transaction-and-new'),
  );

  return (
    <Dialog open={state() === 'open'} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="uppercase">New Transaction</DialogTitle>
        </DialogHeader>
        <form
          action={create.raw.with(transactionDescription, undefined, () => {
            close(cleanupForm);
          })}
          method="post"
        >
          <div class="mb-6 text-left">
            <TextFieldRoot class="lowercase w-full">
              <TextFieldLabel>description</TextFieldLabel>
              <TextField
                type="text"
                name="transaction-description"
                id="transaction-description"
                class="w-full px-3 py-2 border bg-ui-muted focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
                placeholder="coffee, $18, split with..."
                value={transactionDescription()}
                onInput={(e) =>
                  setTransactionDescription(e.currentTarget.value)
                }
              />
            </TextFieldRoot>
          </div>
          <DialogFooter>
            <div class="flex gap-2">
              <ButtonLoadable
                type="submit"
                class="w-full"
                size="sm"
                disabled={create.ctx.pending}
                loading={create.ctx.pending}
              >
                create
              </ButtonLoadable>
              <ButtonLoadable
                onclick={() => void createAndNew()}
                class="w-full"
                size="sm"
                variant="secondary"
                disabled={create.ctx.pending}
                loading={create.ctx.pending}
              >
                create & new
              </ButtonLoadable>
            </div>
            <Button
              as={DialogClose}
              class="w-full"
              variant="outline"
              size="sm"
              onClick={() => {
                close();
              }}
              disabled={create.ctx.pending}
            >
              cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};