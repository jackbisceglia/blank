// import { getContacts } from './-contact.data';
// import { useUpdateTransaction } from './index.data';

// import {
//   Contact,
//   TransactionWithPayeesWithContacts,
//   UpdateableTransactionPartial,
// } from '@blank/core/db';

// import { Button, ButtonLoadable } from '@/components/ui/button';
// import {
//   Combobox,
//   ComboboxContent,
//   ComboboxInput,
//   ComboboxItem,
//   ComboboxTrigger,
// } from '@/components/ui/combobox';
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import {
//   TextField,
//   TextFieldLabel,
//   TextFieldRoot,
// } from '@/components/ui/textfield';
// import { createAsync, useSearchParams } from '@solidjs/router';
// import {
//   Accessor,
//   ParentProps,
//   Setter,
//   Show,
//   Suspense,
//   createEffect,
//   createSignal,
// } from 'solid-js';

// // note: this is an action we invoke locally (/contacts)- as such, we export only a hook with everything needed
// function useDialogState(
//   transaction: Accessor<TransactionWithPayeesWithContacts | undefined>,
//   onClose?: () => void,
// ) {
//   const [searchParams, setSearchParams] = useSearchParams<{
//     action?: 'edit-transaction';
//     id?: string;
//   }>();

//   const state = () => {
//     if (searchParams.action === 'edit-transaction' && !!searchParams.id) {
//       return 'open';
//     }

//     return 'closed';
//   };

//   const open = () => {
//     setSearchParams({ action: 'edit-transaction', id: transaction()?.id });
//   };

//   const close = () => {
//     onClose?.();
//     setSearchParams({ ...searchParams, action: undefined, id: undefined });
//   };

//   const id = () => searchParams.id;

//   const actions = {
//     state,
//     id,
//     open,
//     close,
//     toggle: () => {
//       if (state() === 'open') {
//         close();
//       } else {
//         open();
//       }
//     },
//   };

//   return actions;
// }

// export function useEditTransactionDialog(
//   transaction: Accessor<TransactionWithPayeesWithContacts | undefined>,
//   onClose?: () => void,
// ) {
//   const state = useDialogState(transaction, onClose);

//   return {
//     ...state,
//     Component: (props: Pick<TransactionDialogProps, 'loading'>) => (
//       <EditTransactionDialog
//         loading={props.loading}
//         transaction={transaction}
//         control={state}
//       />
//     ),
//   };
// }

// const useSyncSignal = <T,>(external: Accessor<T>, setInternal: Setter<T>) => {
//   createEffect(() => {
//     const value = external();
//     setInternal(() => value);
//   });
// };

// type Incoming = Pick<Contact, 'name' | 'id'>;

// type ContactsComboboxProps = {
//   options: Incoming[];
//   selected: Incoming[];
//   onChange: (selected: string) => void;
// };

// const ContactsCombobox = (props: ContactsComboboxProps) => {
//   return (
//     // figure out!
//     <Combobox
//       options={props.options}
//       optionValue="id"
//       optionTextValue="name"
//       defaultFilter="startsWith"
//       defaultValue={props.selected}
//       onChange={(e) => {
//         if (!e) return;
//         props.onChange(e);
//       }}
//       itemComponent={(props) => (
//         <ComboboxItem item={props.item}>
//           {/* {props.item.rawValue} */}
//         </ComboboxItem>
//       )}
//     >
//       <ComboboxTrigger>
//         <ComboboxInput />
//       </ComboboxTrigger>
//       <ComboboxContent />
//     </Combobox>
//   );
// };

// type TransactionDialogProps = ParentProps<{
//   transaction: Accessor<TransactionWithPayeesWithContacts | undefined>;
//   control: Omit<ReturnType<typeof useEditTransactionDialog>, 'Component'>;
//   loading: boolean;
// }>;

// const defaultForm: UpdateableTransactionPartial = {
//   description: '',
//   amount: 0,
//   payees: [
//     {
//       contact: {
//         name: '',
//       },
//     },
//   ],
// };

// export const EditTransactionDialog = (props: TransactionDialogProps) => {
//   const contacts = createAsync(() => getContacts());
//   const [form, setForm] =
//     createSignal<UpdateableTransactionPartial>(defaultForm);

//   const formPayeesContacts = () => {
//     return form().payees.map((p) => p.contact)[0] ?? [];
//   };

//   const updateForm = (field: string, value: unknown) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const updateableTransactionPartial = (): UpdateableTransactionPartial => {
//     const t = props.transaction();

//     if (!t) return defaultForm;

//     return {
//       amount: t.amount,
//       description: t.description,
//       payees: t.payees.map((p) => ({ contact: p.contact })),
//     };
//   };

//   useSyncSignal(updateableTransactionPartial, setForm);

//   const updateTransaction = useUpdateTransaction();

//   return (
//     <Dialog
//       open={props.control.state() === 'open'}
//       onOpenChange={() => {
//         props.control.toggle();
//       }}
//     >
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle class="uppercase">Edit Transaction</DialogTitle>
//         </DialogHeader>
//         <Show when={props.transaction()}>
//           {(transaction) => (
//             <form
//               action={updateTransaction.raw.with(
//                 transaction(),
//                 form(),
//                 props.control.close,
//               )}
//               method="post"
//             >
//               <div class="mb-6 text-left space-y-2">
//                 <TextFieldRoot class="lowercase w-full">
//                   <TextFieldLabel>description</TextFieldLabel>
//                   <TextField
//                     type="text"
//                     name="transaction-description"
//                     id="transaction-description"
//                     class="w-full px-3 py-2 border rounded-md bg-ui-muted focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
//                     placeholder="cofee..."
//                     value={form().description}
//                     onInput={(e) => {
//                       updateForm('description', e.currentTarget.value);
//                     }}
//                     disabled={props.loading}
//                   />
//                 </TextFieldRoot>
//                 <TextFieldRoot class="lowercase w-full">
//                   <TextFieldLabel>cost</TextFieldLabel>
//                   <TextField
//                     type="number"
//                     min={1} // update to 1 cent when we add fractions
//                     name="transaction-amount"
//                     id="transaction-amount"
//                     class="w-full px-3 py-2 border rounded-md bg-ui-muted focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
//                     placeholder="$8"
//                     value={form().amount}
//                     onInput={(e) => {
//                       updateForm('amount', parseInt(e.currentTarget.value));
//                     }}
//                     disabled={props.loading}
//                   />
//                 </TextFieldRoot>
//                 <TextFieldRoot class="lowercase w-full">
//                   <TextFieldLabel>contacts</TextFieldLabel>
//                   <Suspense fallback={<p>Loading...</p>}>
//                     <Show
//                       when={contacts()}
//                       fallback={<p>No contacts yet . . . </p>}
//                     >
//                       {(contacts) => (
//                         <>
//                           <ContactsCombobox
//                             selected={formPayeesContacts()}
//                             onChange={(selected) => {
//                               updateForm('payees', [
//                                 { contact: { name: selected } },
//                               ]);
//                             }}
//                             options={contacts()}
//                           />
//                         </>
//                       )}
//                     </Show>
//                   </Suspense>
//                   {/* <ContactsPills options={formPayeesNames()} /> */}
//                 </TextFieldRoot>
//               </div>
//               <DialogFooter>
//                 <ButtonLoadable
//                   class="w-full uppercase"
//                   type="submit"
//                   size="sm"
//                   disabled={props.loading}
//                   // disabled={createContact.ctx.pending}
//                   loading={false}
//                 >
//                   Save
//                 </ButtonLoadable>
//                 <Button
//                   class="w-full uppercase"
//                   variant="outline"
//                   size="sm"
//                   onClick={close}
//                   disabled={updateTransaction.ctx.pending}
//                 >
//                   Cancel
//                 </Button>
//               </DialogFooter>
//             </form>
//           )}
//         </Show>
//       </DialogContent>
//     </Dialog>
//   );
// };
