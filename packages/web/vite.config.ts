import { TanStackRouterVite as tanstack } from "@tanstack/router-plugin/vite";
import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "path";

const config: UserConfig = {
  plugins: [
    tanstack({
      autoCodeSplitting: true,
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/routes.generated.ts",
      routeFileIgnorePrefix: "@",
      routeToken: "layout",
      quoteStyle: "single",
    }),
    react(),
    tailwind(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};

export default defineConfig(config);
