/// <reference types="@solidjs/start/env" />
/// <reference types="@tanstack/table-core" />

import { RowData } from '@tanstack/solid-table';
import { Setter } from 'solid-js';

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    disableGlobalActions?: () => boolean;
    setAnchors?: Setter<number[]>;
  }
}

export {};

// need to figure out a better solution for this
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}
