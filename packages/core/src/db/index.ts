import * as expense from "./expense.schema";
import * as group from "./group.schema";
import * as member from "./member.schema";
import * as participant from "./participant.schema";
import * as preference from "./preference.schema";
import * as user from "./user.schema";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Resource } from "sst";

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
  ...participant,
};

export const db = drizzle(
  neon(`postgresql://${dbUser}:${dbPassword}@${dbHost}/${dbDatabase}`),
  { schema: schemas }
);
