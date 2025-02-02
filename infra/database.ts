// export default new sst.Linkable("DATABASE", {
//   properties: {
//     host: new sst.Secret("DatabaseHost", process.env.NEON_DB_HOST).value,
//     password: new sst.Secret("DatabasePassword", process.env.NEON_DB_PASSWORD)
//       .value,
//     user: "neondb_owner",
//     database: "neondb",
//   },
// });

export default new sst.Linkable("Database", {
  properties: {
    host: new sst.Secret("Host").value,
    password: new sst.Secret("Password").value,
    user: new sst.Secret("User").value,
    database: new sst.Secret("Database").value,
  },
});
