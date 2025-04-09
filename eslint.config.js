import tseslint from "typescript-eslint";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Base ESLint rules and ignore patterns
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      ".sst",
      ".cursorrules",
      "**/eslint.config.js",
      "infra",
    ],
  },

  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Removed no-console rule
    },
  },

  // TypeScript ESLint rules with strict type checking
  ...tseslint.configs.strictTypeChecked,

  // Override specific rules for the entire project
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Disable the base rule so that only the TS-specific rule is active
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
    languageOptions: {
      parserOptions: {
        // This configuration will be overridden by package-specific configs
        project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
      },
    },
  },

  // Add prettier last to disable any conflicting rules
  prettierConfig
);
