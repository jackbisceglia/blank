import { drizzle } from "drizzle-orm/neon-serverless";
import { Resource } from "sst";
import ws from "ws";

import * as schemas from "./schema";

const {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
} = Resource.Database;

export const db = drizzle({
  connection: `postgresql://${dbUser}:${dbPassword}@${dbHost}/${dbDatabase}`,
  ws: ws,
  schema: schemas,
});
