/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "blank",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: true,
        cloudflare: '5.46.0',
      },
    };
  },
  async run() {
    const web = await import('./infra/web');
  },
});
