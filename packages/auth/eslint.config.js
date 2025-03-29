import { fileURLToPath } from "url";
import { dirname } from "path";
import baseConfig from "../../eslint.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Add any package-specific rules here
      "no-console": "off", // Allow console.log in auth package
    },
  },
];
