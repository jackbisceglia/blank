import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";
import { PageHeaderRow } from "@/components/layouts";
import { underline_defaults } from "@/components/ui/utils";
import { build, cn, slugify } from "@/lib/utils";
import { useGetGroupBySlug } from "../@data";
import { PropsWithChildren } from "react";

export const States = {
  Loading: () => null,
  NotFound: (props: { title: string }) => (
    <PrimaryHeading className="mx-auto py-12">
      Group "{props.title}" not found
    </PrimaryHeading>
  ),
};

type GroupNavigationProps = {
  title: string;
  disable?: boolean;
};

function GroupNavigation(props: GroupNavigationProps) {
  const links = ["dashboard", "members", "settings"] as const;

  const buildTo = (l: (typeof links)[number]) =>
    build("/")("groups", "$slug", l !== "dashboard" && l);

  return (
    <div className="sm:ml-auto uppercase text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-4">
      {links.map((link) => (
        <Link
          disabled={props.disable}
          key={link}
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{
            className: `${underline_defaults} text-blank-theme font-semibold`,
          }}
          params={{ title: props.title }}
          from="/"
          to={buildTo(link)}
          className="[&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:text-muted-foreground/70"
        >
          {link}
        </Link>
      ))}
    </div>
  );
}

export function SecondaryRow(props: PropsWithChildren<{ className?: string }>) {
  return (
    <PageHeaderRow className={cn("min-h-8 items-start", props.className)}>
      {props.children}
    </PageHeaderRow>
  );
}

export function GroupBody(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("flex flex-col gap-4 w-full", props.className)}>
      {props.children}
    </div>
  );
}

function GroupLayout() {
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  const title = group.data?.title ?? slugify(params.slug).decode();

  if (group.status === "not-found") return <States.NotFound title={title} />;

  return (
    <>
      <PageHeaderRow className="flex-col gap-2.5 sm:flex-row items-start sm:items-center sm:justify-between pb-1 sm:pb-0">
        <PrimaryHeading>{title}</PrimaryHeading>
        <GroupNavigation title={title} />
      </PageHeaderRow>
      {group.status === "loading" && <States.Loading />}
      {group.status === "success" && <Outlet />}
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug")({
  component: GroupLayout,
  ssr: false,
  loader: (context) => ({ crumb: slugify(context.params.slug).decode() }),
  params: {
    stringify: (params) => ({
      slug: slugify(params.slug).encode(),
    }),
  },
});
