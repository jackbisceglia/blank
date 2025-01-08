import { defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

const { user, database } = Resource.DATABASE;
const host = process.env.NEON_MAIN_DB_HOST;
const password = process.env.NEON_MAIN_DB_PASSWORD;

if (!host || !password) {
  throw new Error('Missing environment variables for Neon main deployment');
}

export default defineConfig({
  strict: true,
  verbose: true,
  schema: './src/db/*.schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    database,
    host,
    password,
    user,
  },
});
