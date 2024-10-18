import database from "./database";

export default new sst.aws.Function("API", {
  url: true,
  link: [database],
  handler: "packages/api/src/index.default",
});
