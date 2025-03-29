import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";

export const Route = createFileRoute("/_protected/groups/")({
  component: GroupsOverview,
  ssr: false,
  loader: () => ({ crumb: "" }), // no crumb- this is handled in the layout for nesting
});

function GroupsOverview() {
  const groups = [
    {
      id: "family",
      name: "Family",
      description: "Family group chat and coordination",
    },
    {
      id: "friends",
      name: "Friends",
      description: "Friend group activities and hangouts",
    },
    {
      id: "apartment",
      name: "The Apartment",
      description: "Apartment-related discussions and planning",
    },
  ];

  return (
    <div className="">
      <PrimaryHeading>GROUPS</PrimaryHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
        {groups.map((group) => (
          <Link key={group.id} to={`/groups/$id`} params={{ id: group.id }}>
            <Card className="hover:bg-card/50 duration-0 h-full">
              <CardHeader>
                <CardTitle className="uppercase">{group.name}</CardTitle>
                <CardDescription className="lowercase">
                  {group.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
