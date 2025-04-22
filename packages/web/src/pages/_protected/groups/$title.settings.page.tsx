import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Route as Layout } from "./$title.layout";
import { useDeleteGroup, useGetGroupBySlug } from "./@data";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { err, ok, okAsync } from "neverthrow";
import { States } from "./$title.layout";
import { useAuthentication } from "@/lib/auth.provider";

function SettingsRoute() {
  const navigate = useNavigate();
  const { title: titleParam } = Layout.useParams();
  const auth = useAuthentication();

  const { data, status } = useGetGroupBySlug({ slug: titleParam }); // pull into route context

  const deleteGroup = useDeleteGroup();
  const [isDeleting, setIsDeleting] = useState(false);

  if (status === "loading") return <States.Loading />;
  if (status === "not-found") return <States.NotFound title={titleParam} />;

  const handleDeleteGroup = async () => {
    const confirm = () =>
      // TODO: should not need option chain
      window.confirm(
        `Are you sure you want to delete the group "${data?.title ?? ""}"? This action cannot be undone.`
      );

    if (!confirm()) return;

    setIsDeleting(true);

    await okAsync(
      await deleteGroup({ id: data?.id ?? "", ownerId: auth.user.id }) // TODO: should not need option chain
    )
      .andThen((result) =>
        result.success ? ok() : err(new Error("Failed to delete group"))
      )
      .match(
        function success() {
          void navigate({ to: "/groups" });
        },
        function error() {
          alert("Failed to delete group");
          setIsDeleting(false);
        }
      );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Group Settings</h1>

      <div className="border rounded-lg p-6 bg-destructive/5">
        <h2 className="text-xl font-semibold text-destructive mb-2">
          Danger Zone
        </h2>
        <p className="text-muted-foreground mb-4">
          Once you delete a group, there is no going back. Please be certain.
        </p>
        <Button
          variant="destructive"
          onClick={() => void handleDeleteGroup()}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Group"}
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_protected/groups/$title/settings/")({
  component: SettingsRoute,
  ssr: false,
  loader: () => ({ crumb: "Settings" }),
});
