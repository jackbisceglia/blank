/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "blank",
      removal: input.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input.stage),
      home: "aws",
      providers: {
        aws: true,
        cloudflare: true,
      },
    };
  },
  async run() {
    await import("./infra/ai");
    const { Auth } = await import("./infra/auth");
    await import("./infra/cluster");
    await import("./infra/database");
    await import("./infra/domain");
    const { Sync } = await import("./infra/sync");
    const { Web } = await import("./infra/web");

    return {
      web: Web.url,
      auth: Auth.url,
      syncViewSyncer: Sync.url,
    };
  },
});
