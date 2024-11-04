import { RouteSectionProps, useNavigate } from '@solidjs/router';
import { ClerkLoaded, SignedIn, useAuth } from 'clerk-solidjs';
import { createEffect, onMount } from 'solid-js';

export default function ProtectedLayout(props: RouteSectionProps) {
  const navigate = useNavigate();

  const handleMetaKeyShortcuts = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'n':
        navigate('/new');
        break;
      case 'h':
        navigate('/');
        break;
    }
  };

  const handleDefaultKeyShortcuts = (e: KeyboardEvent) => {
    console.log('default, ', e.key);
  };

  createEffect(() => {
    const { userId } = useAuth();

    if (userId() === null) {
      navigate('/landing');
    }
  });

  onMount(() => {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        handleMetaKeyShortcuts(e);
      } else {
        handleDefaultKeyShortcuts(e);
      }
    });
  });

  return (
    <ClerkLoaded>
      <SignedIn>
        <main class="mx-auto z-10 flex flex-col px-4 pt-8 text-center gap-5 sm:min-w-96 w-full max-w-screen-xl pb-28">
          {props.children}
        </main>
      </SignedIn>
    </ClerkLoaded>
  );
}
