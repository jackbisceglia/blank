import { SecretWithEnvFallback } from "./utils";

export default new sst.Linkable('Database', {
  properties: {
    host: SecretWithEnvFallback('DatabaseHost'),
    password: SecretWithEnvFallback('DatabasePassword'),
    user: 'neondb_owner',
    database: 'neondb',
  },
});
