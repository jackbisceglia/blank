import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { LoadingDelayed } from "@/components/loading";
import { useQuery } from "@tanstack/react-query";
import { authenticationQueryOptions } from ".";

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery(authenticationQueryOptions());

  if (
    query.status === "error" ||
    (query.status === "pending" && query.failureCount > 0) ||
    (query.status === "success" && !query.data)
  ) {
    return <Navigate to="/landing" search={(p) => ({ ...p })} />;
  }

  if (query.status === "pending") {
    return (
      <LoadingDelayed
        loading={query.isLoading}
        className="min-h-screen"
        whatIsLoading="workspace"
      />
    );
  }

  return children;
}
