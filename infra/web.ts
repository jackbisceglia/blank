// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import api from './api';
import clerk from './clerk';
import domain from './domain';
import sync from './sync';

export default new sst.aws.SolidStart('WEB', {
  path: 'packages/web',
  link: [clerk],
  domain: {
    name:
      $app.stage === 'production'
        ? domain
        : $interpolate`${$app.stage}.${domain}`,
    dns: sst.cloudflare.dns(),
  },
  environment: {
    VITE_API_URL: api.url,
    VITE_CLERK_PUBLISHABLE_KEY: clerk.properties.clerkPublishableKey,
    VITE_PUBLIC_ZERO_CACHE_URL:
      $app.stage === 'production'
        ? $interpolate`${sync.service.url}`
        : 'http://localhost:4848',
  },
});
