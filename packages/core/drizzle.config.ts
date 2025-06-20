import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  out: "./src/db/generated",
  schema: "./src/modules/**/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: Resource.Database.host,
    user: Resource.Database.user,
    password: Resource.Database.password,
    database: Resource.Database.database,
  },
  strict: true,
  verbose: true,
});
