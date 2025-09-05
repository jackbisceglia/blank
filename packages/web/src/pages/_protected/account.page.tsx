import { PrimaryHeading, SubHeading } from "@/components/prose";
import { createFileRoute } from "@tanstack/react-router";
import { GroupBody, SecondaryRow } from "./groups/$slug_id/layout";
import { AccountSettingsCard } from "./@settings/account-settings-card";
import {
  AppPreferencesCard,
  userPreferencesQueryOptions,
} from "./@settings/app-preferences-card";
import { PageHeaderRow } from "@/components/layouts";

function AccountRoute() {
  return (
    <>
      <PageHeaderRow className="min-h-8">
        <PrimaryHeading>Your Account</PrimaryHeading>
      </PageHeaderRow>
      <SecondaryRow>
        <SubHeading>Manage group settings</SubHeading>
      </SecondaryRow>
      <GroupBody className="space-y-0 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <AccountSettingsCard />
        <AppPreferencesCard />
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/account/")({
  component: AccountRoute,
  loader: async ({ context }) => {
    // TODO: fix preloading
    // currently the auth check rejects on returnTo /account
    // not a massive deal for now, retry button resolves immediately afterwards
    // try/catch is a workaround for now that stops error from hitting the ui
    // --> (same problem is on /group/settings as well)
    try {
      context.queryClient.ensureQueryData(userPreferencesQueryOptions());
    } catch {}

    return { crumb: "Account" };
  },
});
