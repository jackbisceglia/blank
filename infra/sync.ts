import clerk from './clerk';
import database from './database';
import domain from './domain';

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const schemaBasePath = 'packages/core/src/zero';

const buildZeroSchema = () => {
  execSync(`npx zero-build-schema -p ${schemaBasePath}/schema.ts`);

  const schemaJson = readFileSync(
    `${schemaBasePath}/zero-schema.json`,
    'utf-8',
  );

  console.log('✓ Zero Schema built');

  return schemaJson;
};

const vpc = new sst.aws.Vpc('VPC', {
  bastion: true,
});

const cluster = new sst.aws.Cluster('CLUSTER', { vpc, forceUpgrade: 'v2' });

const conn = $interpolate`postgresql://${database.properties.user}:${database.properties.password}@${database.properties.host}`;
const ssl = $interpolate`sslmode=require`;

const upstream_db = $interpolate`${conn}/${database.properties.database}?${ssl}`;
const cvr_db = $interpolate`${conn}/${database.properties.database}_cvr?${ssl}`;
const change_db = $interpolate`${conn}/${database.properties.database}_cdb?${ssl}`;

const service = cluster.addService('ZERO', {
  image: 'rocicorp/zero:0.10.2024122404-fdc0c8',
  dev: {
    command: 'npx zero-cache',
  },
  loadBalancer: {
    domain: {
      name:
        $app.stage === 'production'
          ? $interpolate`cache.${domain}`
          : $interpolate`${$app.stage}-cache.${domain}`,
      dns: sst.cloudflare.dns(),
    },
    ports: [{ listen: '443/https', forward: '4848/http' }],
  },

  environment: {
    // db
    ZERO_UPSTREAM_DB: upstream_db,
    ZERO_CVR_DB: cvr_db,
    ZERO_CHANGE_DB: change_db,

    // schema
    ZERO_SCHEMA_JSON: buildZeroSchema(),

    // misc.
    ZERO_REPLICA_FILE: 'zero.db',
    ZERO_NUM_SYNC_WORKERS: '1',
    ZERO_AUTO_RESET: 'true',
    ZERO_AUTH_JWKS_URL: clerk.properties.clerkJwks,
  },
});

export default {
  cluster,
  service,
  connection: upstream_db,
};
