import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";
import { PageHeaderRow } from "@/components/layouts";
import { underline_defaults } from "@/components/ui/utils";
import { build, cn } from "@/lib/utils";
import { PropsWithChildren, useEffect } from "react";
import { useGroupById } from "../../@data/groups";
import { slugify } from "@blank/core/lib/utils/index";
import { transformSlugAndId } from "@/lib/slug_id";
import { useAuthentication } from "@/lib/authentication";
import { LoadingDelayed, LoadingDelayedProps } from "@/components/loading";

export const States = {
  Loading: ({ title: _title, ...props }: LoadingDelayedProps) => (
    <LoadingDelayed title="getting things settled..." {...props} />
  ),
  NotFound: (props: { title: string }) => (
    <PrimaryHeading className="mx-auto py-12">
      Group "{props.title}" not found
    </PrimaryHeading>
  ),
};

function useSyncUrlReactively(
  id: string,
  target: string,
  slug: string | undefined,
) {
  const navigate = Route.useNavigate();

  return () => {
    if (!slug) return;
    if (slug === target) return;

    void navigate({
      to: ".",
      params: (p) => ({ ...p, slug_id: { id, slug: slug } }),
    });
  };
}

type Tabs = (typeof tabs)[number];
const tabs = ["dashboard", "members", "settings"] as const;

const isRootTab = (tab: string) => tab === "dashboard";

type GroupNavigationProps = {
  id: string;
  slug: string;
  disable?: boolean;
};

function GroupNavigation(props: GroupNavigationProps) {
  const authentication = useAuthentication();
  const params = Route.useParams({ select: (s) => s.slug_id });
  const group = useGroupById(params.id);
  const syncUrl = useSyncUrlReactively(
    params.id,
    params.slug,
    group.data?.slug,
  );

  useEffect(syncUrl, [params.id, params.slug, group.data]);

  const permissions: Record<Tabs, () => boolean> = {
    dashboard: () => true,
    members: () => true,
    settings: () => authentication.user.id === group.data?.ownerId,
  };

  const links = (tab: Tabs) =>
    ["groups", "$slug_id", !isRootTab(tab) && tab] as const;

  const buildTo = (l: Tabs) => build("/")(...links(l));

  return (
    <div className="sm:ml-auto uppercase text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-4">
      {tabs
        .filter((tab) => permissions[tab]())
        .map((tab) => (
          <Link
            disabled={props.disable ?? false}
            key={tab}
            activeOptions={{ exact: true, includeSearch: false }}
            activeProps={{
              className: cn(
                underline_defaults,
                "text-blank-theme font-semibold hover:text-blank-theme",
              ),
            }}
            params={{ ...props }}
            from="/"
            to={buildTo(tab)}
            className="active:[&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:text-muted-foreground/70"
          >
            {tab}
          </Link>
        ))}
    </div>
  );
}

export function SecondaryRow(props: PropsWithChildren<{ className?: string }>) {
  return (
    <PageHeaderRow className={cn("items-start", props.className)}>
      {props.children}
    </PageHeaderRow>
  );
}

export function GroupBody(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex flex-col w-full pb-3.5 space-y-5 pt-2.5",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

function GroupLayout() {
  const params = Route.useParams({ select: (p) => p.slug_id });
  const group = useGroupById(params.id);

  const title = group.data?.title ?? slugify(params.slug).decode();

  if (group.status === "not-found") return <States.NotFound title={title} />;

  return (
    <>
      <PageHeaderRow className="min-h-8 flex-col gap-2.5 sm:flex-row items-start sm:items-center sm:justify-between pb-1 sm:pb-0">
        <PrimaryHeading>{title}</PrimaryHeading>
        <GroupNavigation {...params} />
      </PageHeaderRow>
      <Outlet />
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug_id")({
  component: GroupLayout,
  params: {
    parse: (params) => ({
      ...params,
      ...transformSlugAndId.parse(params),
    }),
    stringify: (params) => ({
      ...params,
      ...transformSlugAndId.stringify(params),
    }),
  },
  loader: (context) => ({
    crumb: slugify(context.params["slug_id"].slug).decode(),
  }),
});
