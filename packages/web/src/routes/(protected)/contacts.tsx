import { useCreateContact } from './-contact.data';
import { useNewContactDialog } from './+contact.dialog';
import { ContactTable } from './+contact.table';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/hono';
import { createAsync, query } from '@solidjs/router';
import { Show, Suspense } from 'solid-js';

export const unformatPhoneNumber = (number: string) => {
  const num = number
    .replaceAll('(', '')
    .replaceAll(')', '')
    .replaceAll('-', '');

  return num;
};

export const formatPhoneNumber = (number: string) => {
  const num = unformatPhoneNumber(number);

  if (num.length <= 3) {
    return num;
  } else if (num.length <= 6) {
    return `(${num.slice(0, 3)})-${num.slice(3)}`;
  } else {
    return `(${num.slice(0, 3)})-${num.slice(3, 6)}-${num.slice(6)}`;
  }
};

const getContacts = query(async () => {
  const res = await api.contacts.$get();

  if (!res.ok) {
    throw new Error(`HTTP error! status`);
  }

  const data = await res.json();

  return data;
}, 'contacts');

export default function ContactsPage() {
  const contacts = createAsync(() => getContacts());
  const dialog = useNewContactDialog();
  const createContact = useCreateContact();

  return (
    <>
      <dialog.Component />
      <div class="w-full">
        <div class="w-full flex justify-between items-center py-2">
          <h1 class="text-left text-xl uppercase text-ui-primary">Contacts</h1>
          <div class="flex items-center gap-2">
            <Button
              class="w-20"
              disabled={createContact.ctx.pending}
              onClick={dialog.open}
              variant="outline"
              size="sm"
            >
              New
            </Button>
          </div>
        </div>

        <Suspense fallback={<p>Loading...</p>}>
          <Show when={contacts()} fallback={<p>No contacts yet . . . </p>}>
            {/* TODO: change to cards */}
            {(contacts) => <ContactTable data={contacts()} />}
          </Show>
        </Suspense>
      </div>
    </>
  );
}
