import ai from './ai';
import clerk from './clerk';
import database from './database';
import domain from './domain';

const api = new sst.aws.Function('API', {
  url: true,
  link: [database, ai],
  handler: 'packages/api/src/index.default',

  environment: {
    DEVELOPMENT: process.env.DEVELOPMENT ?? 'false',
    CLERK_SECRET_KEY: clerk.properties.clerkSecretKey,
    CLERK_PUBLISHABLE_KEY: clerk.properties.clerkPublishableKey,
    OPENAI_API_KEY: ai.properties.openaiApiKey,
    MISTRAL_API_KEY: ai.properties.mistralApiKey,
    ANTHROPIC_API_KEY: ai.properties.anthropicApiKey,
  },
});

new sst.aws.Router('ApiRouter', {
  domain: {
    name:
      $app.stage === 'production'
        ? $interpolate`api.${domain}`
        : $interpolate`${$app.stage}-api.${domain}`,
    dns: sst.cloudflare.dns(),
  },
  routes: { '/*': api.url },
});

export default api;
