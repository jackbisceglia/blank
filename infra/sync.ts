export default new sst.x.DevCommand('SYNC', {
  dev: {
    autostart: true,
    command: 'npx sst shell -- zero-cache-dev',
  },
  environment: {
    // db
    ZERO_UPSTREAM_DB: process.env.ZERO_UPSTREAM_DB ?? '',
    ZERO_CVR_DB: process.env.ZERO_CVR_DB ?? '',
    ZERO_CHANGE_DB: process.env.ZERO_CHANGE_DB ?? '',

    // schema stuff
    ZERO_SCHEMA_FILE: process.env.ZERO_SCHEMA_FILE ?? '',
    ZERO_SCHEMA_PATH: process.env.ZERO_SCHEMA_PATH ?? '',
    ZERO_SCHEMA_OUTPUT: process.env.ZERO_SCHEMA_OUTPUT ?? '',

    // other
    ZERO_JWT_SECRET: process.env.ZERO_JWT_SECRET ?? '',
    ZERO_REPLICA_FILE: process.env.ZERO_REPLICA_FILE ?? '',
    ZERO_AUTO_RESET: process.env.ZERO_AUTO_RESET ?? '',
  },
});
