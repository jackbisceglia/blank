import { Pool } from "pg";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";

// TODO: rework to use neon probably
// const client = new Pool({
//   user: Resource.Postgres.username,
//   password: Resource.Postgres.password,
//   database: Resource.Postgres.database,
//   host: Resource.Postgres.host,
//   port: Resource.Postgres.port,
// });

// export const db = drizzle(client);

export * as transactions from "./transactions";
export * as transactionsSQL from "./transactions.schema";
export * as utils from "./utils";
