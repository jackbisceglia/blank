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
  useIsMobile,
} from "@/components/ui/sidebar";
import { cn, PropsWithClassname } from "@/lib/utils";
import {
  createFileRoute,
  isMatch,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { GlobalCommandBar, SearchRoute } from "./@command-bar.dialog";
import { ZeroProvider } from "@/lib/zero/zero-provider";
import { AuthProvider } from "@/lib/authentication/auth-provider";
import { PropsWithChildren } from "react";
import { CreateExpenseDialog } from "./@create-expense.dialog";
import { CreateGroupDialog } from "./groups/@create-group.dialog";
import { Toaster } from "@/components/ui/sonner";
import { SearchRouteSchema as GlobalSearchParams } from "./@command-bar.dialog";
import { SearchRouteSchema as CreateExpenseSearchParams } from "./@create-expense.dialog";
import { SearchRouteSchema as CreateGroupSearchParams } from "./groups/@create-group.dialog";
import * as v from "valibot";
import { authenticationQueryOptions } from "@/lib/authentication";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/loading";

function getCookie(name: string, fallback: string) {
  const all = document.cookie.split(";").map((c) => c.trim().split("="));

  const values = all.find(([key]) => key === name) ?? undefined;

  return values?.at(1) ?? fallback;
}

function Breadcrumbs(props: PropsWithClassname) {
  const isMobile = useIsMobile();
  const breadcrumbs = useMatches()
    .filter((match) => {
      return isMatch(match, "loaderData.crumb");
    })
    .filter((match) => !!match.loaderData?.crumb);

  if (isMobile) {
    const match = breadcrumbs.at(-1);

    if (!match) return null;

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbSeparator />
          <BreadcrumbLink
            asChild
            className={cn(
              "uppercase data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:underline underline-offset-4",
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
              to={match.pathname}
            >
              {match.loaderData?.crumb}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb className={cn(props.className)}>
      <BreadcrumbList>
        <BreadcrumbSeparator />
        {breadcrumbs.map((match, index) => (
          <Fragment key={match.id}>
            <BreadcrumbLink
              asChild
              className={cn(
                "uppercase data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:underline underline-offset-4",
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
                params={match.params}
                // @ts-expect-error TODO: solve why this is happening, but it works for now
                to={match.fullPath}
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

function ApplicationNavigation() {
  const isMobile = useIsMobile();
  const command = SearchRoute.useSearchRoute();

  if (isMobile) return null;

  return (
    <div className="flex">
      <Button
        onClick={() => void command.open()}
        size="xs"
        variant="secondary"
        className="text-muted-foreground h-min py-1 mb-auto"
        aria-label="Open Command Palette"
        title="Open Command Palette"
      >
        Cmd + K
      </Button>
    </div>
  );
}

function ProtectedLayout() {
  return (
    <>
      <GlobalSidebar collapsible="icon" />
      <main className="flex-1 min-w-0 flex flex-col items-start gap-4 sm:gap-1 py-3 px-2.5 sm:px-6 lg:px-8 min-h-full relative">
        <header className="flex justify-start items-center gap-0.5 sm:gap-2 text-sm w-full pb-2">
          <SidebarTrigger />
          <Breadcrumbs className="mr-auto" />
          <ApplicationNavigation />
        </header>
        <Outlet />
      </main>
      <GlobalCommandBar />
      <CreateExpenseDialog />
      <CreateGroupDialog />
      <Toaster />
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

function Component() {
  return (
    <Providers>
      <ProtectedLayout />
    </Providers>
  );
}

export const Route = createFileRoute("/_protected")({
  component: Component,
  loader: async (opts) => {
    return await opts.context.queryClient.ensureQueryData({
      ...authenticationQueryOptions(),
    });
  },
  ssr: "data-only",
  pendingMs: 1000,
  pendingMinMs: 300,
  pendingComponent: () => (
    <Loading whatIsLoading="workspace" className="h-screen m-auto" />
  ),
  validateSearch: v.object({
    // here we define search params for ui that can be shown globally
    action: v.optional(
      v.array(
        v.union([
          GlobalSearchParams.entries.action,
          CreateGroupSearchParams.entries.action,
          CreateExpenseSearchParams.entries.action,
        ]),
      ),
    ),
  }),
});
