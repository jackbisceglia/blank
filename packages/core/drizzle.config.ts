import { Resource } from "sst";
import { defineConfig } from "drizzle-kit";

const { host, user, password, database } = Resource.DATABASE;

export default defineConfig({
  strict: true,
  verbose: true,
  schema: "./src/db/*.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    database,
    host,
    password,
    user,
  },
});
