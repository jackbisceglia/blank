import * as user from "./user.schema";
import * as group from "./group.schema";
import * as member from "./member.schema";
import * as preference from "./preference.schema";
import * as expense from "./expense.schema";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Resource } from "sst";

export * from "./users";
export * from "./user.schema";
export * from "./group.schema";
export * from "./member.schema";
export * from "./preference.schema";
export * from "./expense.schema";

const {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
} = Resource.Database;

const schemas = {
  ...user,
  ...group,
  ...member,
  ...preference,
  ...expense,
};

export const db = drizzle(
  neon(`postgresql://${dbUser}:${dbPassword}@${dbHost}/${dbDatabase}`),
  { schema: schemas },
);
