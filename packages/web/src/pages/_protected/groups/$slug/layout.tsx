import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";
import { PageHeader, PageHeaderRow } from "@/components/layouts";
import { underline_defaults } from "@/components/ui/utils";
import { build, slugify } from "@/lib/utils";
import { useGetGroupBySlug } from "../@data";

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
    <div className="ml-auto uppercase text-sm flex items-center gap-6">
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

function GroupLayout() {
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  const title = group.data?.title ?? slugify(params.slug).decode();

  if (group.status === "not-found") return <States.NotFound title={title} />;

  return (
    <>
      <PageHeader>
        <PageHeaderRow className="h-8 mt-2">
          <PrimaryHeading>{title}</PrimaryHeading>
          <GroupNavigation title={title} />
        </PageHeaderRow>
      </PageHeader>
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
