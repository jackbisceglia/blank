import { useCreateContact } from './-contact.data';
import { formatPhoneNumber } from './contacts';

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
import { createSignal } from 'solid-js';

const FORMATTED_PHONE_LENGTH = '(XXX) XXX-XXXX'.length;

export type DialogState = 'open' | 'closed';

// note: this is an action we invoke locally (/contacts)- as such, we export only a hook with everything needed
function useDialogState() {
  const [searchParams, setSearchParams] = useSearchParams<{
    action?: 'new-contact';
  }>();

  const state = () => {
    if (searchParams.action === 'new-contact') {
      return 'open';
    }

    return 'closed';
  };

  const open = () => {
    setSearchParams({ action: 'new-contact' });
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

export function useNewContactDialog() {
  const state = useDialogState();

  return {
    ...state,
    Component: ContactDialog,
  };
}

export const ContactDialog = () => {
  const { state, close, toggle } = useNewContactDialog();
  const [contactNumber, setContactNumber] = createSignal('');
  const [contactName, setContactName] = createSignal('');

  const contactNumberFormatted = () => formatPhoneNumber(contactNumber());

  const createContact = useCreateContact();

  return (
    <Dialog
      open={state() === 'open'}
      onOpenChange={() => {
        setContactNumber('');
        toggle();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="uppercase">New Contact</DialogTitle>
        </DialogHeader>
        <form
          action={createContact.raw.with(contactName(), contactNumber(), close)}
          method="post"
        >
          <div class="mb-6 text-left space-y-2">
            <TextFieldRoot class="lowercase w-full">
              <TextFieldLabel>name</TextFieldLabel>
              <TextField
                type="name"
                name="contact-name"
                id="contact-name"
                class="w-full px-3 py-2 border  rounded-md bg-ui-muted focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
                placeholder="jane doe"
                value={contactName()}
                onInput={(e) => setContactName(e.currentTarget.value)}
              />
            </TextFieldRoot>

            <TextFieldRoot class="lowercase w-full">
              <TextFieldLabel>Phone</TextFieldLabel>
              <TextField
                type="tel"
                name="contact-number"
                id="contact-number"
                class="w-full px-3 py-2 border  rounded-md bg-ui-muted focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
                placeholder="888-888-8888"
                maxLength={FORMATTED_PHONE_LENGTH}
                value={contactNumberFormatted()}
                onInput={(e) => setContactNumber(e.currentTarget.value)}
              />
            </TextFieldRoot>
          </div>
          <DialogFooter>
            <ButtonLoadable
              class="w-full uppercase"
              type="submit"
              size="sm"
              disabled={createContact.ctx.pending}
              loading={createContact.ctx.pending}
            >
              Create
            </ButtonLoadable>
            <Button
              class="w-full uppercase"
              variant="outline"
              size="sm"
              onClick={close}
              disabled={createContact.ctx.pending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
