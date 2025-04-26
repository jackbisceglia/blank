import { createFileRoute } from "@tanstack/react-router";
import { useGetGroupBySlug } from "./@data";
import { PageHeaderRow } from "@/components/layouts";
import { SubHeading } from "@/components/prose";
import { cn } from "@/lib/utils";
import { useAuthentication } from "@/lib/auth.provider";

function MembersRoute() {
  const { title: titleSlug } = Route.useParams();
  const { data } = useGetGroupBySlug({ slug: titleSlug });
  const auth = useAuthentication();

  const isOwner = data?.owner?.userId === auth.user.id;

  return (
    <>
      <PageHeaderRow className={cn(!data?.description && "py-1", "mb-2")}>
        <SubHeading>
          view {isOwner && "and manage"} the members of this group
        </SubHeading>
      </PageHeaderRow>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$title/members/")({
  component: MembersRoute,
  ssr: false,
  loader: () => ({ crumb: "Members" }),
});
