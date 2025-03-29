import { SideNavigation } from "@/components/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SIDEBAR_COOKIE_NAME,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AuthProvider } from "@/lib/auth/react";
import { cn, isClient } from "@/lib/utils";
import { ZeroProvider } from "@/lib/zero/react";
import {
  createFileRoute,
  isMatch,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import { getCookie as getCookieTanstackStart } from "@tanstack/start/server";
import { Fragment } from "react/jsx-runtime";

const data = {
  groups: [
    { id: "1", title: "Group 1", members: [], url: "/groups/1" },
    { id: "2", title: "Group 2", members: [], url: "/groups/2" },
  ],
  user: { id: "1", name: "John Doe" },
};

function Breadcrumbs() {
  const matches = useMatches();

  const breadcrumbs = matches
    .filter((match) => isMatch(match, "loaderData.crumb"))
    .filter((match) => !!match.loaderData?.crumb);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((match, index) => (
          <Fragment key={match.id}>
            <BreadcrumbLink
              asChild
              className={cn(
                "uppercase data-[status=active]:text-foreground data-[status=active]:underline underline-offset-4"
              )}
            >
              <Link activeOptions={{ exact: true }} from={match.fullPath}>
                {match.loaderData?.crumb}
              </Link>
            </BreadcrumbLink>
            {index !== breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function getCookie(name: string, fallback?: string) {
  const getCookieOnServer = getCookieTanstackStart;
  const getCookieOnClient = (name: string) => {
    const all = document.cookie.split(";").map((c) => c.trim().split("="));

    const [, cookieValue] = all.find(([key]) => key === name) ?? [];

    return cookieValue;
  };

  return (isClient() ? getCookieOnClient : getCookieOnServer)(name) ?? fallback;
}

function Layout() {
  return (
    <AuthProvider>
      <ZeroProvider>
        <SidebarProvider
          className="flex flex-col sm:flex-row"
          defaultOpen={getCookie(SIDEBAR_COOKIE_NAME, "true") === "true"}
        >
          <SideNavigation groups={data.groups} collapsible="icon" />
          <main className="w-full p-2 pl-1">
            <main className="w-full flex flex-col items-start gap-3 py-3 px-6 min-h-full relative">
              <header className="flex items-center gap-2 text-sm">
                <SidebarTrigger className="" />
                <Breadcrumbs />
              </header>
              <Outlet />
            </main>
          </main>
        </SidebarProvider>
      </ZeroProvider>
    </AuthProvider>
  );
}

export const Route = createFileRoute("/_protected")({
  ssr: false,
  component: Layout,
  loader: () => ({ crumb: "Home" }),
});
