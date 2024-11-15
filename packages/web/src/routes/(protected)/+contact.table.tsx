import { useDeleteContact } from './-contact.data';
import { formatPhoneNumber } from './contacts';

import { Contact } from '@blank/core/db';

import { Button, ButtonLoadable } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { For, Show } from 'solid-js';

type ContactTableProps = {
  data: Contact[];
};

const num_columns = 3;

export const ContactTable = (props: ContactTableProps) => {
  const deleteContact = useDeleteContact();

  return (
    <Table class="border text overflow-scroll">
      <TableHeader>
        <TableRow class="h-14 uppercase text-xs *:text-left [&_th:first-child]:pl-6 *:pl-4">
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          {/* replace below with num transactions pending */}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody class="text-ui-muted-foreground">
        <Show
          when={props.data.length}
          fallback={
            <TableRow>
              <TableCell
                colSpan={num_columns}
                class="h-24 w-fit text-center text-lg uppercase"
              >
                No results.
              </TableCell>
            </TableRow>
          }
        >
          <For each={props.data}>
            {(contact) => (
              <TableRow class="*:text-left [&_td:first-child]:pl-6 *:pl-4 [&_td:last-child]:w-1/5">
                <TableCell class="text-ui-foreground font-semibold">
                  {contact.name}
                </TableCell>
                <TableCell class="mr-auto">
                  {formatPhoneNumber(contact.phone)}
                </TableCell>
                <TableCell class="font-medium space-x-2">
                  {/* edit_1 */}
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-20 hover:bg-ui-input"
                  >
                    Edit
                  </Button>
                  <ButtonLoadable
                    onClick={() => void deleteContact.use(contact.id)}
                    loading={deleteContact.ctx.pending}
                    disabled={deleteContact.ctx.pending}
                    variant="destructive"
                    size="sm"
                    class="w-20"
                  >
                    Delete
                  </ButtonLoadable>
                </TableCell>
              </TableRow>
            )}
          </For>
        </Show>
      </TableBody>
    </Table>
  );
};
