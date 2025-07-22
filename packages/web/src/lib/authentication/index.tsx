import { logoutRPC, meRPC } from "@/server/auth/route";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dropAllDatabases } from "@rocicorp/zero";
import { toast } from "sonner";
import { key, useInvalidateAll } from "../query";

export function authenticationQueryOptions() {
  return queryOptions({
    queryKey: key("authentication"),
    queryFn: meRPC,
  });
}

export function useAuthentication() {
  const query = useQuery(authenticationQueryOptions());

  if (!query.data) {
    throw new Error("useAuth must be used beneath the AuthProvider");
  }

  return query.data;
}

export function useLogout() {
  const logout = useServerFn(logoutRPC);
  const invalidate = useInvalidateAll();

  return {
    fn: async function () {
      const reset = await dropAllDatabases();

      if (reset.errors.length !== 0) {
        return toast.error("Issue logging out. Please try again.");
      }

      await invalidate("authentication");
      await logout();
    },
  };
}
