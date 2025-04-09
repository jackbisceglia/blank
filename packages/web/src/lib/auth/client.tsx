import { User } from "@blank/core/db";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { hydrateAsyncServerResult } from "@/lib/neverthrow/serialize";
import { Navigate } from "@tanstack/react-router";
import { Loading } from "@/components/loading";
import * as v from "valibot";
import { getAuthenticatedUserRPC } from "@/rpc/auth.server";

export const Tokens = v.object({
  access: v.string(),
  refresh: v.string(),
});
export type Tokens = v.InferOutput<typeof Tokens>;

const AccessToken = Tokens.entries.access;
export type AccessToken = v.InferOutput<typeof AccessToken>;

const RefreshToken = Tokens.entries.refresh;
export type RefreshToken = v.InferOutput<typeof RefreshToken>;

// --------------------------------
type AuthState =
  | { status: "idle" | "loading" | "error"; user: null }
  | { status: "success"; data: { user: User; access: string } };

type AuthAction =
  | { type: "fetching" }
  | { type: "success"; payload: { user: User; access: string } }
  | { type: "error" }
  | { type: "reset" };

const defaultAuthContext: AuthState = {
  status: "idle",
  user: null,
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "fetching":
      return {
        status: "loading",
        user: null,
      };
    case "success":
      return {
        status: "success",
        data: action.payload,
      };
    case "error":
      return {
        status: "error",
        user: null,
      };
    case "reset":
      return {
        status: "idle",
        user: null,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<{ state: AuthState } | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultAuthContext);

  useEffect(() => {
    void (async () => {
      dispatch({ type: "fetching" });
      const getAuthenticationData = () =>
        hydrateAsyncServerResult(getAuthenticatedUserRPC);

      // need to redirect based on the error we've received
      await getAuthenticationData().match(
        function success(auth) {
          const [user, access] = auth;
          dispatch({ type: "success", payload: { user, access } });
        },
        function error() {
          dispatch({ type: "error" });
        }
      );
    })();
  }, []);

  if (state.status === "error") return <Navigate to="/landing" />;
  if (state.status === "idle" || state.status === "loading")
    return <Loading className="min-h-screen" whatIsLoading="workspace" />;

  return (
    <AuthContext.Provider value={{ state }}>{children}</AuthContext.Provider>
  );
}

export function useAuthentication() {
  const context = useContext(AuthContext);

  if (context?.state.status !== "success") {
    throw new Error(
      "useAuth must be used within an AuthProvider and after authentication is complete"
    );
  }

  return {
    ...context.state.data,
  };
}
