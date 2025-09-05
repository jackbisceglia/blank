import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { LoadingDelayed } from "@/components/loading";
import { useQuery } from "@tanstack/react-query";
import { authenticationQueryOptions } from ".";
import { usePreserveReturnTo } from "./use-return-to";

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery(authenticationQueryOptions());
  const returnTo = usePreserveReturnTo();

  if (
    query.status === "error" ||
    (query.status === "pending" && query.failureCount > 0) ||
    (query.status === "success" && !query.data)
  ) {
    return (
      <Navigate
        to="/landing"
        search={(prev) => ({ ...prev, returnTo: prev.returnTo ?? returnTo })}
      />
    );
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
