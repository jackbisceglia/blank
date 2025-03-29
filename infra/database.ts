import { SecretWithEnvFallback } from "./utils";

export const Database = new sst.Linkable("Database", {
  properties: {
    host: SecretWithEnvFallback("DatabaseHost"),
    password: SecretWithEnvFallback("DatabasePassword"),
    user: "neondb_owner",
    database: "neondb",
  },
});
