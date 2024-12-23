import { schema } from '@blank/core/zero';

import { createZero } from '@rocicorp/zero/solid';
import { decodeJwt } from 'jose';
import Cookies from 'js-cookie';
import { ParentComponent, createContext, useContext } from 'solid-js';

const encodedJWT = Cookies.get('jwt');
const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
// eslint-disable-next-line @typescript-eslint/no-deprecated
const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : 'anon';

const z = createZero({
  userID,
  auth: () => encodedJWT,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  server: import.meta.env.VITE_PUBLIC_SERVER,
  schema,
  // This is often easier to develop with if you're frequently changing
  // the schema. Switch to 'idb' for local-persistence.
  kvStore: 'idb',
});

export type Zero = ReturnType<typeof useZero>;

const ZeroContext = createContext<typeof z>();

export const ZeroProvider: ParentComponent = (props) => {
  return (
    <ZeroContext.Provider value={z}>{props.children}</ZeroContext.Provider>
  );
};

export function useZero() {
  const context = useContext(ZeroContext);
  if (context === undefined) {
    throw new Error(`useZero must be used within a ZeroProvider`);
  }
  return context;
}
