import database from './database';

export default new sst.aws.Function('API', {
  url: true,
  link: [database],
  handler: 'packages/api/src/index.default',
  environment: {
    DEVELOPMENT: process.env.DEVELOPMENT ?? '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? '',
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? '',
  },
});
