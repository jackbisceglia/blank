// app/router.tsx
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routes.generated";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { DefaultCatchBoundary } from "./components/default-catch-boundary";
import { NotFound } from "./components/not-found";
import { scan } from "react-scan";
import { RowData } from "@tanstack/react-table";

const shouldScan = false;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (shouldScan && import.meta.env.VITE_SCAN === "true") {
  scan({ enabled: true, showFPS: true, _debug: "verbose" });
}

// TODO: put zero instance on context to allow preloading in loaders (enables preload on links)
export function createRouter() {
  const queryClient = new QueryClient();

  return routerWithQueryClient(
    createTanStackRouter({
      defaultSsr: false,
      routeTree,
      context: { queryClient },
      defaultPreload: "intent",
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      defaultStructuralSharing: true,
    }),
    queryClient,
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    expand: (id: string) => void;
    updateTitle: (id: string) => void;
  }
}
