import { logoutRPC, meRPC } from "@/server/auth/route";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@/pages/__root";

export function authenticationQueryOptions() {
  return queryOptions({
    queryKey: ["authentication"],
    queryFn: async () => {
      return meRPC();
    },
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
  const queryClient = useQueryClient();
  const logout = useServerFn(logoutRPC);

  return {
    fn: async function () {
      await queryClient.invalidateQueries({ queryKey: ["authentication"] });
      await logout();
    },
  };
}
