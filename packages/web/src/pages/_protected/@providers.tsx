import { SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/lib/auth/client";
import { ZeroProvider } from "@/lib/zero/react";
import { getCookie as getCookieTanstackStart } from "@tanstack/react-start/server";
import { PropsWithChildren } from "react";

function getCookie(name: string, fallback?: string) {
  const getCookieOnServer = getCookieTanstackStart;
  const getCookieOnClient = (name: string) => {
    const all = document.cookie.split(";").map((c) => c.trim().split("="));

    const [, cookieValue] = all.find(([key]) => key === name) ?? [];

    return cookieValue;
  };

  return (
    (import.meta.env.SSR ? getCookieOnServer : getCookieOnClient)(name) ??
    fallback
  );
}

export function ProtectedLayoutProviders(props: PropsWithChildren) {
  return (
    <AuthProvider>
      <ZeroProvider>
        <SidebarProvider
          className="flex flex-col sm:flex-row"
          defaultOpen={getCookie(SIDEBAR_COOKIE_NAME, "true") === "true"}
        >
          {props.children}
        </SidebarProvider>
      </ZeroProvider>
    </AuthProvider>
  );
}
