import './app.css';

import Nav from './components/Nav';
import { WithChildren } from './lib/util.client';
import { ZeroProvider } from './lib/zero';

import { ColorModeProvider, ColorModeScript } from '@kobalte/core';
import { RouteSectionProps, Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ClerkProvider } from 'clerk-solidjs';
import { Suspense } from 'solid-js';

function Providers(props: WithChildren) {
  return (
    <ColorModeProvider>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}
      >
        <ZeroProvider>{props.children}</ZeroProvider>
      </ClerkProvider>
    </ColorModeProvider>
  );
}

function Application(props: RouteSectionProps) {
  return (
    <Providers>
      <ColorModeScript />
      <Nav />
      <Suspense>{props.children}</Suspense>
    </Providers>
  );
}

export default function Root() {
  return (
    <Router root={Application}>
      <FileRoutes />
    </Router>
  );
}
