import {
  DialogProvider,
  NewTransactionDialog,
  useNewTransactionDialog,
} from './(protected)/group/[id]/+transaction.create.dialog';

import Redirect from '@/components/redirect';
import { Toaster } from '@/components/ui/toast';
import { ZeroProvider } from '@/lib/zero';
import { RouteSectionProps, useNavigate } from '@solidjs/router';
import { ClerkLoaded, SignedIn, SignedOut } from 'clerk-solidjs';
import { ParentComponent, onCleanup, onMount } from 'solid-js';

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

  function keyboardNav(e: KeyboardEvent) {
    if (!e.ctrlKey) return;

    handleMetaKeyShortcuts(e);
  }

  onMount(() => {
    window.addEventListener('keydown', keyboardNav);
  });

  onCleanup(() => {
    window.addEventListener('keydown', keyboardNav);
  });

  return <></>;
};

const ProtectedGlobalComponents: ParentComponent = () => {
  return (
    <>
      <Toaster />
      <NewTransactionDialog />
    </>
  );
};

export default function ProtectedLayout(props: RouteSectionProps) {
  onMount(() => {
    console.log('is this running?');
  });

  return (
    <>
      <ClerkLoaded>
        <SignedIn>
          <ZeroProvider>
            <DialogProvider>
              <main class="min-h-full flex flex-col px-8 pb-12 pt-6 text-center gap-4 sm:min-w-96 w-full max-w-screen-xl">
                {props.children}
              </main>
              <ProtectedGlobalComponents />
              <ProtectedGlobalActions />
            </DialogProvider>
          </ZeroProvider>
        </SignedIn>
        <SignedOut>
          <Redirect url={'/landing'} />
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}
