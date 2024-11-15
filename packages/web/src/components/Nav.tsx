import { A, useLocation } from '@solidjs/router';
import { SignOutButton, useAuth } from 'clerk-solidjs';
import { For, JSX, Match, Show, Switch } from 'solid-js';

const linkClasses = 'px-3 py-2 rounded-md uppercase';

function CommandBarSkeleton() {
  return (
    <>
      <li class="flex justify-center text-gray-400 animate-pulse">
        <span class={linkClasses}>Loading...</span>
      </li>
      <li class="flex justify-center text-gray-400 animate-pulse">
        <span class={linkClasses}>Loading...</span>
      </li>
      <li class="flex justify-center text-gray-400 animate-pulse">
        <span class={linkClasses}>Loading...</span>
      </li>
    </>
  );
}

export default function Nav() {
  const auth = useAuth();
  const location = useLocation();
  const active = (paths: string[]) => {
    return paths.includes(location.pathname)
      ? 'text-white font-semibold'
      : 'text-gray-300';
  };

  type DisplayLink = [string, string | JSX.Element];

  const authenticated: DisplayLink[] = [
    [
      '/',
      <>
        <A href="/" class={linkClasses + ' flex items-center gap-2'}>
          <img src="/logo.svg" alt="Logo" class="size-8" />
          Home
        </A>
      </>,
    ],
    ['/contacts', 'Contacts'],
    ['/actions', 'Actions'],
    ['/sign-out', <SignOutButton class={linkClasses} />],
  ];

  const unauthenticated: DisplayLink[] = [
    [
      '/landing',
      <>
        <A href="/landing" class={linkClasses + ' flex items-center gap-2'}>
          <img src="/logo.svg" alt="Logo" class="size-8" />
          Welcome
        </A>
      </>,
    ],
    ['/sign-in', 'Sign In'],
  ];

  return (
    <nav class="bg-transparent my-6 py-4 fixed bottom-0 z-50 text-sm uppercase">
      <ul class="container flex items-center mx-auto bg-ui-background border border-ui-accent rounded-lg w-fit px-4 space-x-4">
        <Show when={auth.isLoaded()} fallback={<CommandBarSkeleton />}>
          <Switch>
            <Match when={auth.userId()}>
              <For each={authenticated}>
                {([path, display]) => (
                  <li
                    class={`flex items-center ${active(
                      path === '/' ? ['/', '/landing'] : [path],
                    )}`}
                  >
                    <Show fallback={display} when={typeof display === 'string'}>
                      <A href={path} class={linkClasses}>
                        {display}
                      </A>
                    </Show>
                  </li>
                )}
              </For>
            </Match>
            <Match when={!auth.userId()}>
              <For each={unauthenticated}>
                {([path, display]) => (
                  <li
                    class={`flex items-center ${active(
                      path === '/' ? ['/', '/landing'] : [path],
                    )}`}
                  >
                    <Show fallback={display} when={typeof display === 'string'}>
                      <A href={path} class={linkClasses}>
                        {display}
                      </A>
                    </Show>
                  </li>
                )}
              </For>
            </Match>
          </Switch>
        </Show>
      </ul>
    </nav>
  );
}
