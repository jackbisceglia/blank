import base from "../../eslint.config.mjs";
import pluginRouter from "@tanstack/eslint-plugin-router";

import * as tsParser from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [".vinxi", ".output"],
  },
  ...pluginRouter.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser.parser,
      parserOptions: {
        project: "tsconfig.json",
      },
    },
  },
  ...base,
];
