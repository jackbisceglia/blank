import pluginJs from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  { ...pluginJs.configs.recommended },
  ...tseslint.configs.strictTypeChecked,
  {
    ignores: ['sst-env.d.ts', 'node_modules', '.sst', 'eslint.config.mjs'],
  },
];
