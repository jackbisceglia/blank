import {
  HeadContent,
  Outlet as Children,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { QueryClient } from "@tanstack/react-query";
// @ts-ignore
import stylesUrl from "@/styles.css?url";

function Document() {
  return (
    <html className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="">
        <Children />
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
      links: [{ rel: "stylesheet", href: stylesUrl }],
    }),
    ssr: true,
    component: () => <Document />,
  },
);
