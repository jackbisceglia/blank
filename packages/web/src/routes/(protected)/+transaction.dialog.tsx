import { useCreateTransaction } from './-transaction.data';

import { Button, ButtonLoadable } from '@/components/ui/button';
import {
  Dialog,
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
import { useSearchParams } from '@solidjs/router';
import {
  createContext,
  createSignal,
  ParentComponent,
  useContext,
} from 'solid-js';

export type DialogState = 'open' | 'closed';

// note: this is an action we invoke globally- as such, we export everything needed to use it globally (context, etc)
function useDialogState() {
  const [searchParams, setSearchParams] = useSearchParams<{
    action?: 'new-transaction';
  }>();

  const state = () => {
    if (searchParams.action === 'new-transaction') {
      return 'open';
    }

    return 'closed';
  };

  const open = () => {
    setSearchParams({ action: 'new-transaction' });
  };
  const close = () => {
    setSearchParams({ ...searchParams, action: undefined });
  };

  const actions = {
    state,
    open,
    close,
    toggle: () => {
      if (state() === 'open') {
        close();
      } else {
        open();
      }
    },
  };

  return actions;
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

export const TransactionDialog = () => {
  const create = useCreateTransaction();
  const { state, close, toggle } = useNewTransactionDialog();
  const [transactionDescription, setTransactionDescription] = createSignal('');

  return (
    <Dialog
      open={state() === 'open'}
      onOpenChange={() => {
        toggle();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="uppercase">New Transaction</DialogTitle>
        </DialogHeader>
        <form
          action={create.raw.with(transactionDescription, close)}
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
            <ButtonLoadable
              class="w-full"
              type="submit"
              size="sm"
              disabled={create.ctx.pending}
              loading={create.ctx.pending}
            >
              create
            </ButtonLoadable>
            <Button
              class="w-full"
              variant="outline"
              size="sm"
              onClick={close}
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
