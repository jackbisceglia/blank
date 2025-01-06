import { schema } from '@blank/core/zero';

import { createZero } from '@rocicorp/zero/solid';
import { useSession } from 'clerk-solidjs';
import { decodeJwt } from 'jose';
import {
  ParentComponent,
  Show,
  createContext,
  createResource,
  useContext,
} from 'solid-js';

const STORE: Parameters<typeof createZero>[0]['kvStore'] = 'idb';

export type Zero = Awaited<ReturnType<typeof useCreateZero>>;

const useCreateZero = async () => {
  const clerk = useSession();
  const jwt = (await clerk.session()?.getToken()) ?? undefined;

  if (!jwt) {
    throw new Error('No JWT found');
  }

  const userID = decodeJwt(jwt).sub as string;

  return createZero({
    userID,
    auth: jwt,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    server: import.meta.env.VITE_PUBLIC_SERVER,
    schema,
    kvStore: STORE,
  });
};

const ZeroContext = createContext<Zero>();

export const ZeroProvider: ParentComponent = (props) => {
  const [z] = createResource(() => useCreateZero());

  return (
    <Show when={z() !== undefined}>
      <ZeroContext.Provider value={z()}>{props.children}</ZeroContext.Provider>
    </Show>
  );
};

export function useZero() {
  const context = useContext(ZeroContext);

  if (context === undefined) {
    throw new Error('useZero must be used within a ZeroProvider');
  }
  return context;
}
