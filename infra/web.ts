import database from "./database";

export default new sst.aws.StaticSite(
  "Web",
  {
    path: "packages/web",
    build: {
      command: "bun build",
      output: "dist",
    },
  },
  {
    link: [database],
  }
);
