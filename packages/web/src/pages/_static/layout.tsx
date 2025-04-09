import { createPublicOnlyRoute } from "@/lib/auth";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_static")({
  beforeLoad: async () => createPublicOnlyRoute(),
  component: () => <Outlet />,
});
