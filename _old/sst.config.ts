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
        cloudflare: '5.46.0',
      },
    };
  },
  console: {
    autodeploy: {
      runner: () => ({
        engine: 'codebuild',
        architecture: 'x86_64',
      }),
      target(event) {
        if (
          event.type === 'branch' &&
          event.branch === 'main' &&
          event.action === 'pushed'
        ) {
          return { stage: 'production' };
        }
      },
    },
  },
  async run() {
    await import('./infra/domain');
    await import('./infra/ai');
    await import('./infra/clerk');
    await import('./infra/database');

    const sync = await import('./infra/sync');
    const api = await import('./infra/api');
    const web = await import('./infra/web');

    return {
      api: api.default.url,
      web: web.default.url,
      connection: sync.default.connection,
      sync: sync.default.service.url,
    };
  },
});
