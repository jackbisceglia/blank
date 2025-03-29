import { relations, sql } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { DrizzleModelTypes } from "./utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { memberTable } from "./member.schema";

export const userTable = pgTable("user", {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  email: text().notNull(),
  name: text().notNull(),
  image: text().notNull(),
});

export const userRelation = relations(userTable, ({ many }) => ({
  members: many(memberTable),
}));

type UserTypes = DrizzleModelTypes<typeof userTable>;

export type User = UserTypes["Select"];
export const User = createSelectSchema(userTable);

export type UserInsert = UserTypes["Insert"];
export const UserInsert = createInsertSchema(userTable);
