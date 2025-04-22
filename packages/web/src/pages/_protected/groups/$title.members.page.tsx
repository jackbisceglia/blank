import { createFileRoute } from "@tanstack/react-router";

function MembersRoute() {
  return <p>members page!</p>;
}

export const Route = createFileRoute("/_protected/groups/$title/members/")({
  component: MembersRoute,
  ssr: false,
  loader: () => ({ crumb: "Members" }),
});
