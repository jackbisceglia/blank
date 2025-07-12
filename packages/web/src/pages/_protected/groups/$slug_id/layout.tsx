import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";
import { PageHeaderRow } from "@/components/layouts";
import { underline_defaults } from "@/components/ui/utils";
import { build, cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import { useGroupById } from "../../@data/groups";
import { slugify } from "@blank/core/lib/utils/index";
import { transformSlugAndId } from "@/lib/slug_id";

export const States = {
  Loading: () => null,
  NotFound: (props: { title: string }) => (
    <PrimaryHeading className="mx-auto py-12">
      Group "{props.title}" not found
    </PrimaryHeading>
  ),
};

type GroupNavigationProps = {
  id: string;
  slug: string;
  disable?: boolean;
};

function GroupNavigation(props: GroupNavigationProps) {
  const links = ["dashboard", "members", "settings"] as const;

  const buildTo = (l: (typeof links)[number]) =>
    build("/")("groups", "$slug_id", l !== "dashboard" && l);

  // test for preload issue
  // <Link
  //   to="/groups/$slug_id/settings"
  //   params={{ slug_id: { id: props.id, slug: props.slug } }}
  // >
  //   Settings 2
  // </Link>

  return (
    <div className="sm:ml-auto uppercase text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-4">
      {links.map((link) => (
        <Link
          disabled={props.disable ?? false}
          key={link}
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{
            className: cn(
              underline_defaults,
              "text-blank-theme font-semibold hover:text-blank-theme",
            ),
          }}
          params={{ ...props }}
          from="/"
          to={buildTo(link)}
          className="active:[&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:text-muted-foreground/70"
        >
          {link}
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
      {group.status === "loading" && <States.Loading />}
      {group.status === "success" && <Outlet />}
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
