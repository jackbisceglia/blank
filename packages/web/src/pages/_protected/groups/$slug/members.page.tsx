import { createFileRoute } from "@tanstack/react-router";
import { PageHeaderRow } from "@/components/layouts";
import { SubHeading } from "@/components/prose";
import { cn } from "@/lib/utils";
import { useAuthentication } from "@/lib/auth.provider";
import { useGetGroupBySlug } from "../@data";

function MembersRoute() {
  const auth = useAuthentication();
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

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

export const Route = createFileRoute("/_protected/groups/$slug/members/")({
  component: MembersRoute,
  ssr: false,
  loader: () => ({ crumb: "Members" }),
});
