import { defineConfig } from '@solidjs/start/config';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  ssr: false,
  server: {
    preset: 'aws-lambda',
  },
  vite: {
    resolve: {
      alias: {
        '@': `${dirname(fileURLToPath(import.meta.url))}/src`,
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    build: {
      target: 'esnext',
    },
  },
});
