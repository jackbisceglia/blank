import { fileURLToPath } from "url";
import { dirname } from "path";
import baseConfig from "../../eslint.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...baseConfig,
  // Add an ignore pattern specific to the web package
  {
    ignores: ["src/components/ui/**", ".output/**", ".vinxi/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    // Add ignores for JS files in this TS-specific block
    ignores: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Add any package-specific rules here for React components
      "@typescript-eslint/only-throw-error": "off", // Allow throwing non-Error objects for redirects
    },
  },
];
