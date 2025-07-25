import { Button } from "@/components/ui/button";
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import { useDeleteGroup } from "../../../@data/groups";
import { useNavigate } from "@tanstack/react-router";
import { withToast } from "@/lib/toast";

type DangerZoneCardProps = {
  groupId: string;
};

export function DangerZoneCard({ groupId }: DangerZoneCardProps) {
  const deleteGroup = useDeleteGroup();
  const navigate = useNavigate();

  async function handleDeleteGroup() {
    const promise = deleteGroup({ groupId });

    await withToast({
      promise,
      classNames: { success: "bg-muted! border-border!" },
      notify: {
        loading: "Deleting group...",
        success: "Group deleted",
        error: "Failed to update group settings",
      },
    });

    void navigate({ to: "/groups" });
  }

  const confirmDelete = useWithConfirmation({
    description: { type: "default", entity: "group" },
    onConfirm: handleDeleteGroup,
  });

  return (
    <>
      <div className="border rounded-md p-4 flex flex-col gap-3 h-min">
        <div>
          <h3 className="text-base font-medium mb-1 uppercase">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-2 lowercase">
            Destructive actions that cannot be undone.
          </p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={confirmDelete.confirm}
          className="w-full"
        >
          Delete Group
        </Button>
      </div>
      <confirmDelete.dialog />
    </>
  );
}
