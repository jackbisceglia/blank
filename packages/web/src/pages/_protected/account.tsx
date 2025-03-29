import { useAuthentication } from "@/lib/auth/react";
import { createFileRoute } from "@tanstack/react-router";

function AccountPage() {
  const auth = useAuthentication();

  return <h1>{auth.user.name}'s Account</h1>;
}

export const Route = createFileRoute("/_protected/account")({
  ssr: false,
  component: AccountPage,
  loader: () => ({ crumb: "Account" }),
});
