import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GroupBody, SecondaryRow } from "./layout";
import { SubHeading } from "@/components/prose";
import { useWithConfirmation } from "@/components/with-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { States } from "./layout";
import { useDeleteGroup, useGroupBySlug } from "../../@data/groups";

function SettingsRoute() {
  const navigate = useNavigate();
  const params = Route.useParams();
  const { data, status } = useGroupBySlug(params.slug);
  const deleteGroup = useDeleteGroup();

  if (status === "not-found") return <States.NotFound title={params.slug} />;
  if (!data) return <States.Loading />;

  const del = useWithConfirmation({
    description: { type: "default", entity: "group" },
    onConfirm: () => {
      const promise = deleteGroup({ groupId: data.id })
        .then(() => {
          void navigate({ to: "/groups" });
        })
        .catch((error: unknown) =>
          console.error("DELETE_ERROR", JSON.stringify(error, null, 2)),
        );

      return promise;
    },
  });

  return (
    <>
      <SecondaryRow>
        <SubHeading>Manage group settings</SubHeading>
      </SecondaryRow>
      <GroupBody className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2 uppercase">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Destructive actions that cannot be undone.
          </p>
          <Button variant="destructive" size="sm" onClick={del.confirm}>
            Delete Group
          </Button>
        </div>
      </GroupBody>
      <del.dialog />
    </>
  );
}

export const Route = createFileRoute("/_protected/groups/$slug/settings/")({
  component: SettingsRoute,
  ssr: false,
  loader: () => ({ crumb: "Settings" }),
});
