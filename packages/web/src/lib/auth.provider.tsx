import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Loading } from "@/components/loading";
import { logoutRPC, meRPC } from "@/server/auth/route";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@/pages/__root";

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

export function authenticationQueryOptions() {
  return queryOptions({
    queryKey: ["authentication"],
    queryFn: async () => {
      console.log("queryFn running");
      return meRPC();
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery(authenticationQueryOptions());

  if (query.status === "pending") {
    return <Loading className="min-h-screen" whatIsLoading="workspace" />;
  }

  if (query.status === "error") {
    return <Navigate to="/landing" />;
  }

  return children;
}

export function useAuthentication() {
  const query = useQuery(authenticationQueryOptions());

  if (!query.data) {
    throw new Error("useAuth must be used beneath the AuthProvider");
  }

  return query.data;
}
