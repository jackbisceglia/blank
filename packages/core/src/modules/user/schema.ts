import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { sql } from "drizzle-orm/sql";
import { memberTable } from "../member/schema";
import { DrizzleModelTypes } from "../../lib/drizzle/utils";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

export const userTable = pgTable("user", {
  id: uuid()
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  email: text().notNull(),
  name: text().notNull(),
  image: text().notNull(),
  plan: text({ enum: ["base", "pro"] })
    .notNull()
    .default("base"),
});

export const userRelation = relations(userTable, ({ many }) => ({
  members: many(memberTable),
}));

type UserTypes = DrizzleModelTypes<typeof userTable>;

export type User = UserTypes["Select"];
export const User = createSelectSchema(userTable);

export type UserInsert = UserTypes["Insert"];
export const UserInsert = createInsertSchema(userTable);
