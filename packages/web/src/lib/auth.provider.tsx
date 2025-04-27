import { createContext, useContext, type ReactNode } from "react";
import { hydrateAsyncServerResult } from "@blank/core/utils";
import { Navigate } from "@tanstack/react-router";
import { Loading } from "@/components/loading";
import * as v from "valibot";
import { logoutRPC, meRPC } from "@/server/auth/route";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { UnsecuredJWT } from "jose";
import { Result } from "neverthrow";
import { JWTExpired } from "jose/errors";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@/pages/__root";

export const Tokens = v.object({
  access: v.string(),
  refresh: v.string(),
});
export type Tokens = v.InferOutput<typeof Tokens>;

const AccessToken = Tokens.entries.access;
export type AccessToken = v.InferOutput<typeof AccessToken>;

const RefreshToken = Tokens.entries.refresh;
export type RefreshToken = v.InferOutput<typeof RefreshToken>;

type User = {
  name: string;
  id: string;
  email: string;
  image: string;
};

type AuthData = { user: User; getAccessToken: () => Promise<string> };

const AuthContext = createContext<{ state: AuthData } | undefined>(undefined);

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

export const authenticationQueryOptions = () =>
  queryOptions({
    queryKey: ["authentication"],
    queryFn: async () => {
      console.log("querying auth");
      return hydrateAsyncServerResult(meRPC).unwrapOr(null);
    },
  });

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery(authenticationQueryOptions());

  if (query.status === "pending") {
    return <Loading className="min-h-screen" whatIsLoading="workspace" />;
  }
  if (query.status === "error" || (!query.data && !query.isFetching)) {
    console.log("navigating to landing page");
    return <Navigate to="/landing" />;
  }

  async function getAccessToken() {
    const token = query.data?.[1];
    if (!token) throw new Error("Authentication failed");

    const decode = Result.fromThrowable(
      () => UnsecuredJWT.decode(token),
      (e) => (e instanceof JWTExpired ? e : undefined)
    );

    const payload = decode();

    if (payload.isErr() && payload.error instanceof JWTExpired) {
      console.log("JWT expired, invalidating query");
      await queryClient.invalidateQueries({ queryKey: ["authentication"] });
    }

    return token;
  }

  return (
    <AuthContext.Provider
      value={{ state: { user: query.data[0], getAccessToken } }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthentication() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider and after authentication is complete"
    );
  }

  return { ...context.state };
}
