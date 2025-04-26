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
  redirect,
  useMatches,
} from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { GlobalCommandBar } from "./@command-bar";
import * as v from "valibot";
import { ZeroProvider, zeroQueryOptions } from "@/lib/zero.provider";
import { authenticationQueryOptions, AuthProvider } from "@/lib/auth.provider";
import { getCookie as getCookieTanstackStart } from "@tanstack/react-start/server";

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
                  cmd: prev.cmd,
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

export const GlobalSearchParams = v.object({
  cmd: v.optional(v.literal("open")),
});
export type GlobalSearchParams = v.InferOutput<typeof GlobalSearchParams>;

function ProtectedLayout() {
  const search = Route.useSearch();

  return (
    <>
      <GlobalSidebar groups={data.groups} collapsible="icon" />
      <GlobalCommandBar searchKey={"cmd"} searchValue={search.cmd} />
      <main className="w-full flex flex-col items-start gap-3 py-3 pl-10 pr-14 min-h-full relative">
        <header className="flex items-center gap-2 text-sm w-full">
          <SidebarTrigger />
          <Breadcrumbs />
        </header>
        <Outlet />
      </main>
    </>
  );
}

export const Route = createFileRoute("/_protected")({
  ssr: false,
  loader: (opts) => {
    void opts.context.queryClient.ensureQueryData(authenticationQueryOptions());
  },
  component: () => {
    return (
      <AuthProvider>
        <ZeroProvider>
          <SidebarProvider
            className="flex flex-col sm:flex-row"
            defaultOpen={getCookie(SIDEBAR_COOKIE_NAME, "true") === "true"}
          >
            <ProtectedLayout />
          </SidebarProvider>
        </ZeroProvider>
      </AuthProvider>
    );
  },
  validateSearch: GlobalSearchParams,
});
