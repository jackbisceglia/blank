import { PrimaryHeading } from "@/components/prose";
import { createFileRoute } from "@tanstack/react-router";

function AccountRoute() {
  return <PrimaryHeading>Your Account</PrimaryHeading>;
}

export const Route = createFileRoute("/_protected/account/")({
  component: AccountRoute,
  loader: () => ({ crumb: "Account" }),
});
