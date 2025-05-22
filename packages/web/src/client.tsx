/// <reference types="vinxi/types/client" />
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start";
import { createRouter } from "./router";

const router = createRouter();
export type Router = typeof router;

hydrateRoot(document, <StartClient router={router} />);
