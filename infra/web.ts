import api from "./api";

export default new sst.aws.SolidStart("WEB", {
  path: "packages/web",
  environment: {
    VITE_API_URL: api.url,
    VITE_API_DEMO: "abc",
  },
});
