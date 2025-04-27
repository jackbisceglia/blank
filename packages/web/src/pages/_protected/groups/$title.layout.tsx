import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";
import { useGetGroup } from "./@data";
import { PageHeader, PageHeaderRow } from "@/components/layouts";
import { underline_defaults } from "@/components/ui/utils";
import { build, slug } from "@/lib/utils";

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
    build("/")("groups", "$title", l !== "dashboard" && l);

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
  const group = useGetGroup(params.title, "slug");

  const fallbackTitle = slug(params.title).decode();

  if (group.status === "not-found")
    return <States.NotFound title={fallbackTitle} />;

  return (
    <>
      <PageHeader>
        <PageHeaderRow className="h-8 mt-2">
          <PrimaryHeading>{group.data?.title ?? fallbackTitle}</PrimaryHeading>
          <GroupNavigation title={group.data?.title ?? fallbackTitle} />
        </PageHeaderRow>
      </PageHeader>
      {group.status === "loading" && <States.Loading />}
      {group.status === "success" && <Outlet />}
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$title")({
  component: GroupLayout,
  ssr: false,
  loader: ({ params }) => ({ crumb: slug(params.title).decode() }),
  params: {
    stringify: (params) => ({
      title: slug(params.title).encode(),
    }),
  },
});
