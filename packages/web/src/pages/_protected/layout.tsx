import { GlobalSidebar } from "@/components/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  isMatch,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { ProtectedLayoutProviders } from "./@providers";
import { GlobalCommandBar } from "./@command-bar";
import * as v from "valibot";

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
            <BreadcrumbLink
              asChild
              className={cn(
                "uppercase data-[status=active]:text-foreground data-[status=active]:underline underline-offset-4"
              )}
            >
              <Link
                activeOptions={{ exact: true, includeSearch: false }}
                search={(prev) => ({
                  ...prev,
                  action: prev.action,
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

function ProtectedLayout() {
  const search = Route.useSearch();
  return (
    <ProtectedLayoutProviders>
      <GlobalSidebar groups={data.groups} collapsible="icon" />
      <GlobalCommandBar searchParamKey={search.cmd} />
      <main className="w-full p-2 pl-1">
        <main className="w-full flex flex-col items-start gap-3 py-3 px-6 min-h-full relative">
          <header className="flex items-center gap-2 text-sm">
            <SidebarTrigger className="" />
            <Breadcrumbs />
          </header>
          <Outlet />
        </main>
      </main>
    </ProtectedLayoutProviders>
  );
}

export const GlobalSearchParams = v.object({
  cmd: v.optional(v.literal("open")),
  action: v.optional(v.literal("new-expense")),
});

export const Route = createFileRoute("/_protected")({
  ssr: false,
  component: ProtectedLayout,
  validateSearch: GlobalSearchParams,
});
