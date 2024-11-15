import {
  DialogProvider,
  TransactionDialog,
  useNewTransactionDialog,
} from './(protected)/+transaction.dialog';

import Redirect from '@/components/redirect';
import { Toaster } from '@/components/ui/toast';
import { RouteSectionProps, useNavigate } from '@solidjs/router';
import { ClerkLoaded, SignedIn, SignedOut } from 'clerk-solidjs';
import { onMount, ParentComponent } from 'solid-js';

const ProtectedGlobalActions = () => {
  const navigate = useNavigate();
  const { open } = useNewTransactionDialog();

  const handleMetaKeyShortcuts = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'n':
        open();
        break;
      case 'h':
        navigate('/');
        break;
      case 'd':
        navigate('/');
        break;
    }
  };

  onMount(() => {
    window.addEventListener('keydown', (e) => {
      if (!e.ctrlKey) return;

      handleMetaKeyShortcuts(e);
    });
  });

  return <></>;
};

const ProtectedGlobalComponents: ParentComponent = () => {
  return (
    <>
      <Toaster />
      <TransactionDialog />
    </>
  );
};

export default function ProtectedLayout(props: RouteSectionProps) {
  return (
    <>
      <ClerkLoaded>
        <SignedIn>
          <DialogProvider>
            <main class="mx-auto z-10 flex flex-col px-4 pt-8 text-center gap-5 sm:min-w-96 w-full max-w-screen-xl pb-28">
              {props.children}
            </main>
            <ProtectedGlobalComponents />
            <ProtectedGlobalActions />
          </DialogProvider>
        </SignedIn>

        <SignedOut>
          <Redirect url={'/landing'} />
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}
