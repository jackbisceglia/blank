import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Loading } from "@/components/loading";
import { useQuery } from "@tanstack/react-query";
import { authenticationQueryOptions } from ".";

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
