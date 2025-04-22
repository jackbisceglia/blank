import { createFileRoute } from "@tanstack/react-router";

// const States = {
//   Loading: () => null,
//   NotFound: (props: { title: string }) => (
//     <PrimaryHeading className="mx-auto py-12">
//       Group "{props.title}" not found
//     </PrimaryHeading>
//   ),
// };

function GroupRoute() {
  return <p>dashboard page!</p>;
}

export const Route = createFileRoute("/_protected/groups/$title/")({
  component: GroupRoute,
  ssr: false,
  // loader: () => ({ crumb: "Dashboard" }),
});
