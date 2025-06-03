import {
  HeadContent,
  Outlet as Children,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import appCss from "@/styles.css?url";
import { seo } from "@/lib/seo";
import { QueryClient } from "@tanstack/react-query";

function Document() {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="dark">
        <Children />
        {/* <TanStackRouterDevtools position="bottom-right" /> */}
        <Scripts />
      </body>
    </html>
  );
}

export function useQueryClient() {
  const context = Route.useRouteContext();

  return context.queryClient;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        ...seo({
          title: "withblank.com",
          description: `Expense Splitting Made Easy`,
        }),
      ],
      links: [{ rel: "stylesheet", href: appCss }],
    }),
    component: () => <Document />,
  }
);
