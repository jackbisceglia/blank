import { createFileRoute, Outlet } from "@tanstack/react-router";

function RouteComponent() {
  return (
    <>
      Navigation
      <main className="min-h-full flex flex-col px-8 pb-48 pt-6 text-center gap-4 sm:min-w-96 w-full max-w-screen-2xl">
        <Outlet />
      </main>
    </>
  );
}

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
});
