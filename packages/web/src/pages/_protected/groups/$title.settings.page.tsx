import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from "@tanstack/react-router";
import { useDeleteGroup, useGetGroupBySlug } from "./@data";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { States } from "./$title.layout";
import { cn } from "@/lib/utils";
import { PageHeaderRow } from "@/components/layouts";
import { SubHeading } from "@/components/prose";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
};

function ConfirmDialog({
  title,
  description,
  open,
  onOpenChange,
  onSuccess,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog defaultOpen={true} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="py-4 px-6 sm:max-w-xl">
        <DialogHeader className="py-2 gap-1.5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>This action cannot be undone</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <DialogDescription>{description}</DialogDescription>
        </div>
        <DialogFooter className="[&>*]:w-full py-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              void onSuccess();
            }}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsRoute() {
  const navigate = useNavigate();
  const { title: titleParam } = getRouteApi(
    "/_protected/groups/$title"
  ).useParams();
  const deleteGroup = useDeleteGroup();

  const { data, status } = useGetGroupBySlug({ slug: titleParam }); // pull into route context

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (status === "loading") return <States.Loading />;
  if (status === "not-found") return <States.NotFound title={titleParam} />;

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      await deleteGroup({ groupId: data?.id ?? "" });
      void navigate({ to: "/groups" });
    } catch (error) {
      setIsDeleting(false);
      console.log("DELETE_ERROR", JSON.stringify(error, null, 2));
    }
  };

  return (
    <>
      <PageHeaderRow className={cn(!data?.description && "py-1", "mb-2")}>
        <SubHeading>Manage group settings</SubHeading>
      </PageHeaderRow>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2 uppercase">Group Details</h3>
          <p className="text-sm text-muted-foreground mb-4">
            View and manage basic information about your group.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Future implementation
            }}
          >
            Edit Details
          </Button>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2 uppercase">
            Notification Settings
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure how you receive notifications for group activity.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Future implementation
            }}
          >
            Configure
          </Button>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2 uppercase">
            Privacy Settings
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Control who can view your group and its expenses.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Future implementation
            }}
          >
            Adjust Privacy
          </Button>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2 uppercase">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Destructive actions that cannot be undone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setShowDeleteDialog(true);
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Group"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        title="Are you absolutely sure?"
        description={`This will permanently delete the group "${data?.title ?? "Unknown"}", along with all of its associated data. Be sure to backup your data before permanently deleting.`}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleDeleteGroup}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$title/settings/")({
  component: SettingsRoute,
  ssr: false,
  loader: () => ({ crumb: "Settings" }),
});
