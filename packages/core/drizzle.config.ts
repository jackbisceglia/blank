import { defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

const { host, user, password, database } = Resource.DATABASE;

export default defineConfig({
  strict: true,
  verbose: true,
  out: './src/db/generated',
  schema: './src/db/*.schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    database,
    host,
    password,
    user,
  },
});
