import {
  HeadContent,
  Outlet as Children,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import appCss from "@/styles/app.css?url";
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
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      //   {
      //     charSet: "utf-8",
      //   },
      //   {
      //     name: "viewport",
      //     content: "width=device-width, initial-scale=1",
      //   },
      ...seo({
        title: "withblank.com",
        description: `Expense Splitting Made Easy`,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // {
      //   rel: "apple-touch-icon",
      //   sizes: "180x180",
      //   href: "/apple-touch-icon.png",
      // },
      // {
      //   rel: "icon",
      //   type: "image/png",
      //   sizes: "32x32",
      //   href: "/favicon-32x32.png",
      // },
      // {
      //   rel: "icon",
      //   type: "image/png",
      //   sizes: "16x16",
      //   href: "/favicon-16x16.png",
      // },
      // { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      // { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: () => <Document />,
});
