import { fileURLToPath } from "url";
import { dirname } from "path";
import baseConfig from "../../eslint.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...baseConfig,
  // Package-specific overrides
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    // Add any package-specific rules here
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  },
];
