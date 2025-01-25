import { readFileSync } from "node:fs";
import database from "./database";
import { domain } from "./utils";

const schemaBasePath = "./packages/core/src/zero";

const connection = (databaseName: string) =>
  $interpolate`postgresql://${database.properties.user}:${database.properties.password}@${database.properties.host}/${databaseName}?sslmode=require`;

const zeroEnv = {
  ZERO_SCHEMA_JSON: readFileSync(
    `${schemaBasePath}/zero-schema.json`
  ).toString(),
  ZERO_UPSTREAM_DB: connection(`${database.properties.database}`),
  ZERO_CVR_DB: connection(`${database.properties.database}_cvr`),
  ZERO_CHANGE_DB: connection(`${database.properties.database}_change`),
  ZERO_AUTO_RESET: "true",
  ZERO_REPLICA_FILE: "zero.db",
  ZERO_SHARD_ID: $app.stage,
};

const vpc = new sst.aws.Vpc("VPC", {
  bastion: true,
});

const cluster = new sst.aws.Cluster("Cluster", { vpc, forceUpgrade: "v2" });

export const zero = cluster.addService("Sync", {
  image: "registry.hub.docker.com/rocicorp/zero:0.11.2025012200-592c81",
  link: [database],
  environment: {
    ...zeroEnv,
    ...($dev
      ? {
          ZERO_NUM_SYNC_WORKERS: "1",
        }
      : {
          ZERO_CHANGE_STREAMER_URI: `ws://zeroreplication.${$app.stage}.${$app.name}.sst:4849`,
          ZERO_UPSTREAM_MAX_CONNS: "15",
          ZERO_CVR_MAX_CONNS: "160",
        }),
  },
  loadBalancer: {
    domain: `cache.${domain}`,
    ports: [
      { listen: "443/https", forward: "4848/http" },
      { listen: "80/http", forward: "4848/http" },
    ],
  },
  dev: {
    command: "bun dev",
    directory: "packages/zero",
    url: "http://localhost:4848",
  },
});

if (!$dev) {
  cluster.addService(`SyncReplication`, {
    cpu: "2 vCPU",
    memory: "8 GB",
    image: "registry.hub.docker.com/rocicorp/zero:0.11.2025012200-592c81",
    link: [database],
    environment: {
      ...zeroEnv,
      ZERO_CHANGE_MAX_CONNS: "3",
      ZERO_NUM_SYNC_WORKERS: "0",
    },
    logging: {
      retention: "1 month",
    },
  });
}
// import { domain } from "./utils";
// import database from "./database";

// import { execSync } from "child_process";
// import { readFileSync } from "fs";

// const schemaBasePath = "packages/core/src/zero";
//     `${schemaBasePath}/zero-schema.json`,

// const buildZeroSchema = () => {
//   execSync(`npx zero-build-schema -p ${schemaBasePath}/schema.ts`);

//   const schemaJson = readFileSync(
//     `${schemaBasePath}/zero-schema.json`,
//     "utf-8"
//   );

//   console.log("✓ Zero Schema built");

//   return schemaJson;
// };

// const vpc = new sst.aws.Vpc("VPC", {
//   bastion: true,
// });

// const cluster = new sst.aws.Cluster("CLUSTER", { vpc, forceUpgrade: "v2" });

// const conn = $interpolate`postgresql://${database.properties.user}:${database.properties.password}@${database.properties.host}`;
// const ssl = $interpolate`sslmode=require`;

// const upstream_db = $interpolate`${conn}/${database.properties.database}?${ssl}`;
// const cvr_db = $interpolate`${conn}/${database.properties.database}_cvr?${ssl}`;
// const change_db = $interpolate`${conn}/${database.properties.database}_cdb?${ssl}`;

// const service = cluster.addService("ZERO", {
//   image: "rocicorp/zero:0.10.2024122404-fdc0c8",
//   dev: {
//     command: "npx zero-cache",
//   },
//   loadBalancer: {
//     domain: {
//       name:
//         $app.stage === "production"
//           ? $interpolate`cache.${domain}`
//           : $interpolate`${$app.stage}-cache.${domain}`,
//       dns: sst.cloudflare.dns(),
//     },
//     ports: [{ listen: "443/https", forward: "4848/http" }],
//   },
//   environment: {
//     // db
//     ZERO_UPSTREAM_DB: upstream_db,
//     ZERO_CVR_DB: cvr_db,
//     ZERO_CHANGE_DB: change_db,

//     // schema
//     ZERO_SCHEMA_JSON: buildZeroSchema(),

//     // misc.
//     ZERO_REPLICA_FILE: "zero.db",
//     ZERO_NUM_SYNC_WORKERS: "1",
//     ZERO_AUTO_RESET: "true",
//     ZERO_AUTH_SECRET: "secretkey",
//   },
// });

// export default {
//   cluster,
//   service,
//   connection: upstream_db,
// };
