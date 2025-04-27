import { SecretWithEnvFallback } from "./utils";

export const Database = new sst.Linkable("Database", {
  properties: (() => {
    const properties = {
      host: SecretWithEnvFallback("DatabaseHost"),
      password: SecretWithEnvFallback("DatabasePassword"),
      user: "neondb_owner",
      database: "neondb",
    };
    return {
      ...properties,
      connection: $interpolate`postgresql://${properties.user}:${properties.password}@${properties.host}/${properties.database}?sslmode=require`,
    };
  })(),
});
