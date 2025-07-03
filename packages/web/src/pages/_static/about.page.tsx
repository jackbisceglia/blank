import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_static/about/")({
  ssr: true,
  component: AboutRoute,
});

function AboutRoute() {
  return <div>Hello "/_static/about"!</div>;
}
