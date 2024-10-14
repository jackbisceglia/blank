import api from "./api";

export default new sst.aws.SolidStart("web", {
  path: "packages/web",
  link: [api],
});
