// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { domain } from "./utils";

new sst.aws.StaticSite("Web", {
  path: 'packages/web',
  build: {
    command: "pnpm run build",
    output: "dist",
  },
  domain: {
    name:
      $app.stage === 'production'
        ? domain
        : $interpolate`${$app.stage}.${domain}`,
    dns: sst.cloudflare.dns(),
  },
});