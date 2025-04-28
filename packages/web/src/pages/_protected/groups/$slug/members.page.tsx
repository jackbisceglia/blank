import { createFileRoute } from "@tanstack/react-router";
import { SubHeading } from "@/components/prose";
import { useAuthentication } from "@/lib/auth.provider";
import { useGetGroupBySlug } from "../@data";
import { GroupBody, SecondaryRow } from "./layout";

function MembersRoute() {
  const auth = useAuthentication();
  const params = Route.useParams();
  const group = useGetGroupBySlug(params.slug);

  const isOwner = group.data?.owner?.userId === auth.user.id;

  return (
    <>
      <SecondaryRow>
        <SubHeading>
          view {isOwner && "and manage"} the members of this group
        </SubHeading>
      </SecondaryRow>
      <GroupBody>
        <p>dis is allada members</p>
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/members/")({
  component: MembersRoute,
  ssr: false,
  loader: () => ({ crumb: "Members" }),
});
