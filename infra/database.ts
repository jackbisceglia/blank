export default new sst.Linkable("DATABASE", {
  properties: {
    host: new sst.Secret("DatabaseHost", process.env.NEON_DB_HOST).value,
    password: new sst.Secret("DatabasePassword", process.env.NEON_DB_PASSWORD)
      .value,
    user: "neondb_owner",
    database: "neondb",
  },
});
