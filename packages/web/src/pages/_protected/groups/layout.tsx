import { createFileRoute, Outlet } from "@tanstack/react-router";

// !!!NOTE!!!
// THIS FILE ONLY EXISTS TO PROVIDE THE BREADCRUMB IN THE ROUTE MATCHER
// MAYBE WE WILL ADD STUFF LATER
export const Route = createFileRoute("/_protected/groups")({
  component: RouteComponent,
  loader: () => ({ crumb: "Groups" }),
  ssr: false,
});

function RouteComponent() {
  return <Outlet />;
}
