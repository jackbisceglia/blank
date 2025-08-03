import { Database } from "./database";
import { Cluster } from "./cluster";
import { execSync } from "child_process";
import { getAuthJwksUrl } from "./auth";
import { NonDevelopmentOnly, ProductionStageOnly } from "./utils";
import { domains } from "./domain";

const SyncReplicationBucket = new sst.aws.Bucket(`SyncReplicationBucket`);

const getZeroSchemaRelativePath = () => "../packages/zero/schema.ts";

const getZeroVersion = () => {
  const pkg = "@rocicorp/zero";

  const zero = JSON.parse(execSync(`npm list ${pkg} --json`).toString());

  return zero.dependencies[pkg].version;
};

const getPushUrl = () => {
  const protocol = $dev ? "http://" : "https://";
  const host = $dev ? "localhost:3000" : domains.web.name;
  return $interpolate`${protocol}${host}/api/sync/push`;
};

const commonEnvironmentVariables = {
  ZERO_UPSTREAM_DB: Database.properties.connection,
  ZERO_AUTH_JWKS_URL: getAuthJwksUrl(),
  ZERO_REPLICA_FILE: "sync-replica.db",
  ZERO_IMAGE_URL: `rocicorp/zero:${getZeroVersion()}`,
  ZERO_PUSH_URL: getPushUrl(),
  ZERO_CVR_MAX_CONNS: "10",
  ZERO_UPSTREAM_MAX_CONNS: "10",
  ...ProductionStageOnly(() => ({
    ZERO_LITESTREAM_BACKUP_URL: $interpolate`s3://${SyncReplicationBucket.name}/backup`,
  })),
};

export const Sync = new sst.aws.Service(`SyncViewSyncer`, {
  cluster: Cluster,
  capacity: "spot",
  ...NonDevelopmentOnly(() => ({
    cpu: "1 vCPU",
    memory: "2 GB",
  })),
  architecture: "arm64",
  image: commonEnvironmentVariables.ZERO_IMAGE_URL,
  link: [SyncReplicationBucket, Database],
  health: {
    command: ["CMD-SHELL", "curl -f http://localhost:4848/ || exit 1"],
    interval: "5 seconds",
    retries: 3,
    startPeriod: "300 seconds",
  },
  environment: {
    ...commonEnvironmentVariables,
    ...NonDevelopmentOnly(() => ({})),
  },
  logging: {
    retention: "1 month",
  },
  loadBalancer: {
    domain: domains.sync,
    rules: [
      { listen: "443/https", forward: "4848/http" },
      { listen: "80/http", forward: "4848/http" },
    ],
  },
  transform: {
    target: {
      healthCheck: {
        enabled: true,
        path: "/keepalive",
        protocol: "HTTP",
        interval: 5,
        healthyThreshold: 2,
        timeout: 3,
      },
      stickiness: {
        enabled: true,
        type: "lb_cookie",
        cookieDuration: 120,
      },
      loadBalancingAlgorithmType: "least_outstanding_requests",
    },
  },
  dev: {
    command: "pnpm dev",
    directory: "packages/zero",
    url: "http://localhost:4848",
  },
});

if (!$dev) {
  new command.local.Command(
    "zero-deploy-permissions",
    {
      create: [
        "npx zero-deploy-permissions",
        "-p",
        getZeroSchemaRelativePath(),
      ].join(" "),
      triggers: [Date.now()],
      environment: {
        ZERO_UPSTREAM_DB: commonEnvironmentVariables.ZERO_UPSTREAM_DB,
      },
    },
    { dependsOn: Sync },
  );
}
