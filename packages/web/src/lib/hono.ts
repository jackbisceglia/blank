import { AppType } from '@blank/api-main';

import { hc } from 'hono/client';

const invalid = 'INVALID';

const endpoint: string = (import.meta.env.VITE_API_URL ?? invalid) as string;

if (endpoint === invalid) {
  console.error('No endpoint given in environment');
}

export const api = hc<AppType>(endpoint, {
  async headers() {
    const token = await window.Clerk?.session?.getToken();

    return {
      Authorization: `Bearer ${token ?? invalid}`,
    };
  },
});
