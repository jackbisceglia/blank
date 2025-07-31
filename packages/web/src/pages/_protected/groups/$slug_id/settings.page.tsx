import { createFileRoute } from "@tanstack/react-router";
import { GroupBody, SecondaryRow } from "./layout";
import { SubHeading } from "@/components/prose";
import { States } from "./layout";
import { useGroupById } from "../../@data/groups";
import { GroupSettingsCard } from "./@settings/group-settings-card";
import {
  invitesQueryOptions,
  InviteSettingsCard,
} from "./@settings/invite-settings-card";
import { DangerZoneCard } from "./@settings/danger-zone-card";
import { useAuthentication } from "@/lib/authentication";
import { isTaggedError, TaggedError } from "@blank/core/lib/effect/index";
import { Match } from "effect";
import {
  DefaultCatchBoundary,
  DefaultFallbackError,
} from "@/components/default-catch-boundary";
import { slugify } from "@blank/core/lib/utils/index";

const PageErrors = {
  DataNotFound: class _ extends TaggedError("DataNotFoundError") {},
  NotAuthorized: class _ extends TaggedError("UserNotAuthorizedError") {},
} as const;

type PageErrors = InstanceType<(typeof PageErrors)[keyof typeof PageErrors]>;

function SettingsRoute() {
  const authentication = useAuthentication();
  const params = Route.useParams({ select: (p) => p.slug_id });
  const group = useGroupById(params.id);

  return Match.value(group).pipe(
    Match.when({ status: "loading" }, (group) => {
      return <States.Loading loading={group.status === "loading"} />;
    }),
    Match.whenOr({ status: "not-found" }, { data: Match.undefined }, () => {
      const group = slugify(params.slug).decode();

      throw new PageErrors.DataNotFound(`Could not load data for ${group}`);
    }),
    Match.not({ data: { ownerId: authentication.user.id } }, () => {
      throw new PageErrors.NotAuthorized(
        "Must be group owner to view settings.",
      );
    }),
    Match.orElse(({ data }) => {
      return (
        <>
          <SecondaryRow>
            <SubHeading>Manage group settings</SubHeading>
          </SecondaryRow>
          <GroupBody className="space-y-0 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <GroupSettingsCard group={data} />
            <InviteSettingsCard groupId={data.id} groupSlug={params.slug} />
            <DangerZoneCard groupId={data.id} />
          </GroupBody>
        </>
      );
    }),
  );
}

export const Route = createFileRoute("/_protected/groups/$slug_id/settings/")({
  errorComponent: (props) => {
    if (!isTaggedError<PageErrors>(props.error)) {
      return <DefaultFallbackError />;
    }

    return Match.value(props.error).pipe(
      Match.whenOr(
        { _tag: "DataNotFoundError" },
        { _tag: "UserNotAuthorizedError" },
        (error) => (
          <DefaultCatchBoundary
            reset={() => {}}
            error={new Error(error.message)}
          />
        ),
      ),
      Match.orElse(() => <DefaultFallbackError />),
    );
  },
  component: SettingsRoute,
  loader: async (opts) => {
    try {
      await opts.context.queryClient.ensureQueryData(
        invitesQueryOptions(opts.params.slug_id.id),
      );
    } catch {}

    return { crumb: "Settings" };
  },
});
