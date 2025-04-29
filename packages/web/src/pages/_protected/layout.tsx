import { GlobalSidebar } from "@/components/navigation";
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
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  isMatch,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { GlobalCommandBar } from "./@command-bar";
import { ZeroProvider } from "@/lib/zero.provider";
import { authenticationQueryOptions, AuthProvider } from "@/lib/auth.provider";
import { getCookie as getCookieTanstackStart } from "@tanstack/react-start/server";
import { PropsWithChildren } from "react";
import { SearchParams } from "./@search-params";
import { CreateExpenseDialog } from "./@create-expense";
import { CreateGroupDialog } from "./groups/@create-group";

function getCookie(name: string, fallback?: string) {
  const getCookieOnServer = getCookieTanstackStart;
  const getCookieOnClient = (name: string) => {
    const all = document.cookie.split(";").map((c) => c.trim().split("="));

    const [, cookieValue] = all.find(([key]) => key === name) ?? [];

    return cookieValue;
  };

  return (
    (import.meta.env.SSR ? getCookieOnServer : getCookieOnClient)(name) ??
    fallback
  );
}

const data = {
  groups: [
    { id: "1", title: "Group 1", members: [], url: "/groups/1" },
    { id: "2", title: "Group 2", members: [], url: "/groups/2" },
  ],
  user: { id: "1", name: "John Doe" },
};

function Breadcrumbs() {
  const breadcrumbs = useMatches()
    .filter((match) => isMatch(match, "loaderData.crumb"))
    .filter((match) => !!match.loaderData?.crumb);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((match, index) => (
          <Fragment key={match.id}>
            {index === 0 && <BreadcrumbSeparator />}
            <BreadcrumbLink
              asChild
              className={cn(
                "uppercase data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:underline underline-offset-4"
              )}
            >
              <Link
                activeOptions={{
                  exact: true,
                  includeSearch: false,
                }}
                search={(prev) => ({
                  ...prev,
                  action: prev.action,
                })}
                from={match.fullPath}
              >
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

function ProtectedLayout() {
  return (
    <>
      <GlobalSidebar groups={data.groups} collapsible="icon" />
      <GlobalCommandBar />
      <CreateExpenseDialog />
      <CreateGroupDialog />
      <main className="w-full flex flex-col items-start gap-3.5 py-3 px-6 md:pl-10 md:pr-14 min-h-full relative">
        <header className="flex items-center gap-2 text-sm w-full">
          <SidebarTrigger />
          <Breadcrumbs />
        </header>
        <Outlet />
      </main>
    </>
  );
}

function Providers(props: PropsWithChildren) {
  return (
    <AuthProvider>
      <ZeroProvider>
        <SidebarProvider
          className="flex flex-col sm:flex-row"
          defaultOpen={getCookie(SIDEBAR_COOKIE_NAME, "true") === "true"}
        >
          {props.children}
        </SidebarProvider>
      </ZeroProvider>
    </AuthProvider>
  );
}

export const Route = createFileRoute("/_protected")({
  ssr: false,
  loader: (opts) => {
    void opts.context.queryClient.ensureQueryData(authenticationQueryOptions());
  },
  component: () => (
    <Providers>
      <ProtectedLayout />
    </Providers>
  ),
  validateSearch: SearchParams,
});
