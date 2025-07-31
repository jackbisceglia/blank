import { SecretWithEnvFallback } from "./utils";

export const Database = new sst.Linkable("Database", {
  properties: (() => {
    const properties = {
      host: SecretWithEnvFallback("DatabaseHost"),
      password: SecretWithEnvFallback("DatabasePassword"),
      database: SecretWithEnvFallback("DatabaseName"),
      user: "neondb_owner",
    };
    return {
      ...properties,
      connection: $interpolate`postgresql://${properties.user}:${properties.password}@${properties.host}/${properties.database}?sslmode=require`,
    };
  })(),
});
