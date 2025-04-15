import { AI } from "./ai";
import { Auth } from "./auth";
import { Database } from "./database";
import { getDomainConfig } from "./domain";
import { Sync } from "./sync";

export const Web = new sst.aws.TanstackStart("Web", {
  path: "packages/web",
  dev: {
    command: "pnpm dev",
    url: "http://localhost:3000",
  },
  environment: {
    VITE_AUTH_SERVER_URL: Auth.url,
    VITE_SYNC_SERVER_URL: $interpolate`${Sync.url}`,
  },
  domain: getDomainConfig({
    type: "root",
    stage: $app.stage,
  }),
  link: [Database, AI],
});
