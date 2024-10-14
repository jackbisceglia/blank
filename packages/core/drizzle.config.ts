import { Resource } from "sst";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  strict: true,
  verbose: true,
  schema: "./src/*.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    database: Resource.Postgres.database,
    secretArn: Resource.Postgres.secretArn,
    resourceArn: Resource.Postgres.clusterArn,
  },
});
