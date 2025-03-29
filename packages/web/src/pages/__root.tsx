import {
  HeadContent,
  Outlet as Children,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    // meta: [
    //   {
    //     charSet: "utf-8",
    //   },
    //   {
    //     name: "viewport",
    //     content: "width=device-width, initial-scale=1",
    //   },
    //   ...seo({
    //     title:
    //       "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
    //     description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
    //   }),
    // ],
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

function Document() {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="dark">
        <Children />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
