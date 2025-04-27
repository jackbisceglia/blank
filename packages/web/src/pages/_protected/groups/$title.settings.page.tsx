import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from "@tanstack/react-router";
import { useDeleteGroup, useGetGroup } from "./@data";
import { States } from "./$title.layout";
import { cn } from "@/lib/utils";
import { PageHeaderRow } from "@/components/layouts";
import { SubHeading } from "@/components/prose";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

function SettingsRoute() {
  const navigate = useNavigate();
  const route = getRouteApi("/_protected/groups/$title");
  const params = route.useParams();

  const group = useGetGroup(params.title, "slug");
  const deleteGroup = useDeleteGroup();

  const confirmDelete = useConfirmDialog({
    title: "Are you absolutely sure?",
    description: `This will permanently delete the group "${group.data?.title ?? "Unknown"}", along with all of its associated data. Be sure to backup your data before permanently deleting.`,
    confirm: "Delete",
    cancel: "Cancel",
    async onSuccess() {
      try {
        await deleteGroup({ groupId: group.data?.id ?? "" });
        void navigate({ to: "/groups" });
      } catch (error) {
        console.log("DELETE_ERROR", JSON.stringify(error, null, 2));
      }
    },
  });

  if (group.status === "loading") return <States.Loading />;
  if (group.status === "not-found")
    return <States.NotFound title={params.title} />;

  return (
    <>
      <PageHeaderRow className={cn(!group.data?.description && "py-1", "mb-2")}>
        <SubHeading>Manage group settings</SubHeading>
      </PageHeaderRow>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2 uppercase">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Destructive actions that cannot be undone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={confirmDelete.confirm}
          >
            Delete Group
          </Button>
        </div>
      </div>
      <confirmDelete.dialog />
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$title/settings/")({
  component: SettingsRoute,
  ssr: false,
  loader: () => ({ crumb: "Settings" }),
});
