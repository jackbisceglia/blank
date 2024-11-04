import base from '../../eslint.config.mjs';

import solid from 'eslint-plugin-solid/configs/typescript';
import * as tsParser from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['.vinxi', '.output'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...solid,
    languageOptions: {
      parser: tsParser.parser,
      parserOptions: {
        project: 'tsconfig.json',
      },
    },
  },
  ...base,
];
