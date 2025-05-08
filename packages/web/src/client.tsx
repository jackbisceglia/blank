// app/client.tsx
/// <reference types="vinxi/types/client" />
import { scan } from "react-scan";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start";
import { createRouter } from "./router";

if (import.meta.env.VITE_SCAN === "true") {
  scan({
    enabled: true,
    showFPS: true,
    _debug: "verbose",
  });
}

export const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);
