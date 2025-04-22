import {
  HeadContent,
  Outlet as Children,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import appCss from "@/styles/app.css?url";
import { seo } from "@/lib/seo";

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

export const Route = createRootRoute({
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
  // errorComponent: () => <div>error</div>,
  // notFoundComponent: () => <NotFound />,
  component: () => <Document />,
});
