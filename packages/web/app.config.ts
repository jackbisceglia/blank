import { defineConfig } from "@tanstack/start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), tsConfigPaths()],
    resolve: {
      alias: {
        "@": path.resolve(root, "./src"),
      },
    },
  },
  tsr: {
    appDirectory: "./src",
    autoCodeSplitting: true,
    routesDirectory: "./src/pages",
    generatedRouteTree: "./src/routes.generated.ts",
    routeFileIgnorePrefix: "@",
    routeToken: "layout",
    quoteStyle: "single",
  },
});
