import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PrimaryHeading, SubHeading } from "@/components/prose";
import { useGetGroupBySlug } from "./@data";
import { PageHeader, PageHeaderRow } from "@/components/layouts";
import { underline_defaults } from "@/components/ui/utils";
import { build, cn, slug } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { title: titleSlug } = Route.useParams();
  const { data, status } = useGetGroupBySlug({ slug: titleSlug });
  const fallback = slug(titleSlug).decode();

  if (status === "not-found") return <States.NotFound title={titleSlug} />;

  return (
    <>
      <PageHeader>
        <PageHeaderRow className="h-8 mt-2">
          <PrimaryHeading>{data?.title ?? fallback}</PrimaryHeading>
          <GroupNavigation title={data?.title ?? fallback} />
        </PageHeaderRow>
        {/* <PageHeaderRow className={cn(!data?.description && "py-1")}>
          {data?.description ? (
            <SubHeading> {data.description} </SubHeading>
          ) : (
            <Skeleton className="h-4 w-1/5 min-w-40 max-w-60 my-auto" />
          )}
        </PageHeaderRow> */}
      </PageHeader>
      {status === "loading" && <States.Loading />}
      {status === "success" && <Outlet />}
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
