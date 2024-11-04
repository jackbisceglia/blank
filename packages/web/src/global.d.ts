/// <reference types="@solidjs/start/env" />

export {};

// need to figure out a better solution for this
declare global {
  interface Window {
    Clerk: {
      session: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}
