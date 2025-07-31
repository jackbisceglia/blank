import { AI } from "./ai";
import { Auth } from "./auth";
import { Database } from "./database";
import { domains } from "./domain";
import { Sync } from "./sync";

export const Web = new sst.aws.TanStackStart("Web", {
  path: "packages/web",
  dev: {
    command: "pnpm dev",
    url: "http://localhost:3000",
  },
  environment: {
    VITE_APP_URL: $dev ? "localhost:3000" : domains.web.name,
    VITE_AUTH_SERVER_URL: Auth.url,
    VITE_SYNC_SERVER_URL: $interpolate`${Sync.url}`,
    VITE_SCAN: "true",
  },
  domain: domains.web,
  link: [Database, AI],
});
