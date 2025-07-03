import { createFileRoute, Outlet } from "@tanstack/react-router";

function GroupsLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/_protected/groups")({
  component: GroupsLayout,
  loader: () => ({ crumb: "Groups" }),
});
