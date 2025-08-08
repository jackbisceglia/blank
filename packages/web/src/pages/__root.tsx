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
    head: () => {
      const website =
        process.env.NODE_ENV === "development"
          ? "dev.withblank.com"
          : "withblank.com";

      return {
        meta: [
          ...seo({
            title: website,
            description: `Expense Splitting Made Easy`,
          }),
          {
            name: "viewport",
            content: "width=device-width, initial-scale=1",
          },
        ],
        links: [
          { rel: "stylesheet", href: stylesUrl },
          { rel: "preconnect", href: "https://fonts.googleapis.com" },
          {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossOrigin: "anonymous",
          },
        ],
      };
    },
    ssr: true,
    component: () => <Document />,
  },
);
