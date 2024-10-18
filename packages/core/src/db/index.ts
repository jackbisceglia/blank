import { Resource } from "sst";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const { host, user, password, database } = Resource.DATABASE;

export const db = drizzle(
  neon(`postgresql://${user}:${password}@${host}/${database}`)
);

export * from "./transaction.schema";
export * from "./transaction";
