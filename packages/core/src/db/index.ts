import * as expense from "./expense.schema";
import * as group from "./group.schema";
import * as member from "./member.schema";
import * as participant from "./participant.schema";
import * as preference from "./preference.schema";
import * as user from "./user.schema";

import { drizzle } from "drizzle-orm/neon-serverless";
import { Resource } from "sst";
import ws from "ws";

export * from "./expense.schema";
export * from "./expense";
export * from "./group.schema";
export * from "./group";
export * from "./member.schema";
export * from "./participant.schema";
export * from "./participant";
export * from "./preference.schema";
export * from "./user.schema";
export * from "./users";
export * from "./utils";

const {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
} = Resource.Database;

export const schemas = {
  ...user,
  ...group,
  ...member,
  ...preference,
  ...expense,
  ...participant,
};

export const db = drizzle({
  connection: `postgresql://${dbUser}:${dbPassword}@${dbHost}/${dbDatabase}`,
  ws: ws,
  schema: schemas,
});
