import { PrimaryHeading } from "@/components/prose";
import { createFileRoute } from "@tanstack/react-router";

function AccountPage() {
  return <PrimaryHeading>Your Account</PrimaryHeading>;
}

export const Route = createFileRoute("/_protected/account")({
  ssr: false,
  component: AccountPage,
  loader: () => ({ crumb: "Account" }),
});
