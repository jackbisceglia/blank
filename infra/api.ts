import db from "./db";

export default new sst.aws.Function("api", {
  url: true,
  link: [db],
  handler: "packages/api/src/index",
});
