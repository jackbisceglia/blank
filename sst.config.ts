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
        // cloudflare: true,
      },
    };
  },
  async run() {
    await import("./infra/database");
    await import("./infra/web");
    // await import("./infra/zero");
  },
});
