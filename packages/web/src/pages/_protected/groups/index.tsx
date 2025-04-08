import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PrimaryHeading, SecondaryHeading } from "@/components/prose";
import { Group } from "@blank/zero";
import { useCreateGroup, useGetGroupsList } from "./@data";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { PageHeader, PageHeaderRow } from "@/components/layouts";
import { CreateGroupDialog } from "./@create-group";
import * as v from "valibot";
import { useAuthentication } from "@/lib/auth/client";

type GroupListProps = {
  groups: Group[];
};

function GroupList(props: GroupListProps) {
  return props.groups.map((group) => (
    <Link key={group.id} to={`/groups/$title`} params={{ title: group.title }}>
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
  // Loading: () => <Loading whatIsLoading="groups" />,
  Loading: () => <Loading whatIsLoading="groups" />,
  Empty: () => (
    <SecondaryHeading className="mx-auto py-12">
      You are not a member of any groups yet.
    </SecondaryHeading>
  ),
};

function GroupsRoute() {
  const search = Route.useSearch();
  const { user } = useAuthentication();
  const { data, status } = useGetGroupsList(user.id);
  const createGroup = useCreateGroup(user.id, user.name);

  // if (status === "loading") return <States.Loading />;

  return (
    <>
      <CreateGroupDialog
        onSubmit={createGroup}
        searchKey="action"
        searchValue={search.action}
      />
      <PageHeader>
        <PageHeaderRow className="h-8">
          <PrimaryHeading>Your Groups</PrimaryHeading>
          <Button asChild size="sm" variant="theme" className="ml-auto">
            <Link to="." search={{ action: "new-group" }}>
              New Group
            </Link>
          </Button>
        </PageHeaderRow>
      </PageHeader>
      {status === "empty" ? (
        <States.Empty />
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
          <GroupList groups={data} />
        </div>
      )}
    </>
  );
}

export const CreateGroupSearchParams = v.object({
  action: v.optional(v.literal("new-group")),
});

export type CreateGroupSearchParams = v.InferOutput<
  typeof CreateGroupSearchParams
>;

export const Route = createFileRoute("/_protected/groups/")({
  component: GroupsRoute,
  ssr: false,
  loader: () => ({ crumb: "" }), // no crumb- this is handled in the layout for nesting
  validateSearch: CreateGroupSearchParams,
});
