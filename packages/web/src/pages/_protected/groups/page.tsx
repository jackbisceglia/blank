import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PrimaryHeading, SecondaryHeading } from "@/components/prose";
import { Group } from "@blank/zero";
import { useGroupListByUserId } from "../@data/groups";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { PageHeaderRow } from "@/components/layouts";
import { useAuthentication } from "@/lib/authentication";

type GroupListProps = {
  groups: Group[];
};

function GroupList(props: GroupListProps) {
  return props.groups.map((group) => (
    <Link
      key={group.id}
      to={`/groups/$slug_id`}
      params={{ slug_id: { id: group.id, slug: group.slug } }}
    >
      <Card className="hover:bg-card/50 duration-0 h-full">
        <CardHeader>
          <CardTitle className="uppercase">{group.title}</CardTitle>
          <CardDescription className="lowercase">
            {group.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  ));
}

const States = {
  Loading: () => <Loading whatIsLoading="groups" />,
  Empty: () => (
    <SecondaryHeading className="mx-auto py-12">
      You are not a member of any groups yet.
    </SecondaryHeading>
  ),
};
function GroupsRoute() {
  const { user } = useAuthentication();
  const groups = useGroupListByUserId(user.id);

  return (
    <>
      <PageHeaderRow className="h-8">
        <PrimaryHeading>Your Groups</PrimaryHeading>
        <Button asChild size="sm" variant="theme" className="ml-auto">
          <Link
            to="."
            search={(prev) => ({
              action: ["new-group", ...(prev.action ?? [])],
            })}
          >
            Create Group
          </Link>
        </Button>
      </PageHeaderRow>
      {groups.status === "empty" ? (
        <States.Empty />
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
          <GroupList groups={groups.data} />
        </div>
      )}
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/")({
  component: GroupsRoute,
  loader: () => ({ crumb: "" }), // no crumb- this is handled in the layout for nesting
});
