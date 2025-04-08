import { Database } from "./database";
import { Cluster } from "./cluster";
import { execSync } from "child_process";
import { getAuthJwksUrl } from "./auth";
import {
  DevelopmentOnly,
  NonDevelopmentOnly,
  ProductionStageOnly,
} from "./utils";

const SyncReplicationBucket = new sst.aws.Bucket(`SyncReplicationBucket`);

const getZeroSchemaRelativePath = () => "../packages/zero/src/schema.ts";

const getZeroVersion = () =>
  execSync("npm list @rocicorp/zero | grep @rocicorp/zero | cut -f 3 -d @")
    .toString()
    .trim();

const getDatabaseConnection = () => {
  const { user, password, host, database } = Database.properties;

  const url = $interpolate`postgresql://${user}:${password}@${host}/${database}?sslmode=require`;
  return url;
};

const commonEnvironmentVariables = {
  ZERO_UPSTREAM_DB: getDatabaseConnection(),
  ZERO_CVR_DB: getDatabaseConnection(),
  ZERO_CHANGE_DB: getDatabaseConnection(),
  ZERO_AUTH_JWKS_URL: getAuthJwksUrl(),
  ZERO_REPLICA_FILE: "sync-replica.db",
  ZERO_IMAGE_URL: `rocicorp/zero:${getZeroVersion()}`,
  ZERO_CVR_MAX_CONNS: "10",
  ZERO_UPSTREAM_MAX_CONNS: "10",
  ...ProductionStageOnly(() => ({
    ZERO_LITESTREAM_BACKUP_URL: $interpolate`s3://${SyncReplicationBucket.name}/backup`,
  })),
};

export const SyncReplicationManager = NonDevelopmentOnly(
  () =>
    new sst.aws.Service(`SyncReplicationManager`, {
      cluster: Cluster,
      ...ProductionStageOnly(() => ({
        cpu: "0.5 vCPU",
        memory: "1 GB",
      })),
      architecture: "arm64",
      image: commonEnvironmentVariables.ZERO_IMAGE_URL,
      link: [SyncReplicationBucket, Database],
      health: {
        command: ["CMD-SHELL", "curl -f http://localhost:4849/ || exit 1"],
        interval: "5 seconds",
        retries: 3,
        startPeriod: "300 seconds",
      },
      environment: {
        ...commonEnvironmentVariables,
        ZERO_CHANGE_MAX_CONNS: "3",
        ZERO_NUM_SYNC_WORKERS: "0",
      },
      loadBalancer: {
        public: false,
        ports: [
          {
            listen: "80/http",
            forward: "4849/http",
          },
        ],
      },
      transform: {
        loadBalancer: {
          idleTimeout: 3600,
        },
        target: {
          healthCheck: {
            enabled: true,
            path: "/keepalive",
            protocol: "HTTP",
            interval: 5,
            healthyThreshold: 2,
            timeout: 3,
          },
        },
      },
    })
);

export const Sync = new sst.aws.Service(`SyncViewSyncer`, {
  cluster: Cluster,
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
    ...NonDevelopmentOnly(() => ({
      ZERO_CHANGE_STREAMER_URI: SyncReplicationManager!.url,
    })),
  },
  logging: {
    retention: "1 month",
  },
  loadBalancer: {
    public: true,
    rules: [{ listen: "80/http", forward: "4848/http" }],
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

if (SyncReplicationManager) {
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
    { dependsOn: Sync }
  );
}
