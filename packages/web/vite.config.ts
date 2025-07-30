// vite.config.ts
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const root = path.dirname(fileURLToPath(import.meta.url));

console.log("node env from vite: ", process.env.NODE_ENV);

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({
      target: "aws-lambda",
      tsr: {
        routesDirectory: "./src/pages",
        generatedRouteTree: "./src/routes.generated.ts",
        routeFileIgnorePrefix: "@",
        routeToken: "layout",
        indexToken: "page",
        quoteStyle: "single",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
    },
  },
});
