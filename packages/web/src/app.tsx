import './app.css';

import Nav from './components/Nav';

import { Router, RouteSectionProps } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ClerkProvider } from 'clerk-solidjs';
import { Suspense } from 'solid-js';

function Application(props: RouteSectionProps) {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}
    >
      <Nav />
      <Suspense>{props.children}</Suspense>
    </ClerkProvider>
  );
}

export default function Root() {
  return (
    <Router root={Application}>
      <FileRoutes />
    </Router>
  );
}
