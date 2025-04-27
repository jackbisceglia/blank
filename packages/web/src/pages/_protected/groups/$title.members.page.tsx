import { createFileRoute } from "@tanstack/react-router";
import { PageHeaderRow } from "@/components/layouts";
import { SubHeading } from "@/components/prose";
import { cn } from "@/lib/utils";
import { useAuthentication } from "@/lib/auth.provider";
import { useGetGroup } from "./@data";

function MembersRoute() {
  const params = Route.useParams();
  const auth = useAuthentication();
  const group = useGetGroup(params.title, "slug");

  const isOwner = group.data?.owner?.userId === auth.user.id;

  return (
    <>
      <PageHeaderRow className={cn(!group.data?.description && "py-1", "mb-2")}>
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
