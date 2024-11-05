// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'blank',
      removal: input.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: true,
        neon: '0.6.3',
      },
    };
  },
  async run() {
    await import('./infra/database');
    const api = await import('./infra/api');
    const web = await import('./infra/web');

    return {
      api: api.default.url,
      web: web.default.url,
    };
  },
});
