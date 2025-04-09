// import { isDevOrProduction } from "./utils";

// [infra]
// export const Vpc = isDevOrProduction
//   ? new sst.aws.Vpc("Vpc", {
//       bastion: true,
//     })
//   : sst.aws.Vpc.get("Vpc", "<UPDATE>");

const Vpc = new sst.aws.Vpc(`VirtualPrivateCloud`, {
  az: 2,
});

export const Cluster = new sst.aws.Cluster("Cluster", {
  vpc: Vpc,
});
