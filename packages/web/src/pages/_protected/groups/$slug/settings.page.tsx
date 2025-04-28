import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDeleteGroup, useGetGroupBySlug } from "../@data";
import { cn } from "@/lib/utils";
import { PageHeaderRow } from "@/components/layouts";
import { SubHeading } from "@/components/prose";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { States } from "./layout";

function SettingsRoute() {
  const navigate = useNavigate();
  const params = Route.useParams();

  const group = useGetGroupBySlug(params.slug);

  if (group.status === "not-found")
    return <States.NotFound title={params.slug} />;

  const deleteGroup = useDeleteGroup();
  const confirmDelete = useConfirmDialog({
    title: "Are you absolutely sure?",
    description: `This will permanently delete the group "${group.data?.title ?? "unknown"}", along with all of its associated data. Be sure to backup your data before permanently deleting.`,
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

export const Route = createFileRoute("/_protected/groups/$slug/settings/")({
  component: SettingsRoute,
  ssr: false,
  loader: () => ({ crumb: "Settings" }),
});
