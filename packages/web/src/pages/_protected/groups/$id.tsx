import { createFileRoute } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";

function GroupPage() {
  const { id } = Route.useParams();

  const groupName = id;
  return <PrimaryHeading>{groupName}</PrimaryHeading>;
}

export const Route = createFileRoute("/_protected/groups/$id")({
  component: GroupPage,
  ssr: false,
  loader: ({ params }) => ({ crumb: params.id }),
});
