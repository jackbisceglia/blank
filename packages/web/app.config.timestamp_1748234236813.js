// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";
var root = path.dirname(fileURLToPath(import.meta.url));
var app_config_default = defineConfig({
  vite: {
    plugins: [tailwindcss(), tsConfigPaths()],
    resolve: {
      alias: {
        "@": path.resolve(root, "./src")
      }
    }
  },
  react: {
    babel: {
      plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]]
    }
  },
  tsr: {
    appDirectory: "./src",
    autoCodeSplitting: true,
    routesDirectory: "./src/pages",
    generatedRouteTree: "./src/routes.generated.ts",
    routeFileIgnorePrefix: "@",
    routeToken: "layout",
    indexToken: "page",
    quoteStyle: "single"
  }
});
export {
  app_config_default as default
};
