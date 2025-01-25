import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { PgTable, pgTableCreator, text } from 'drizzle-orm/pg-core';
// import { Resource } from 'sst';
import { uuidv7 as genUUIDv7 } from 'uuidv7';

export const uuidv7 = () => text();

export const uuidv7WithDefault = () => uuidv7().$defaultFn(genUUIDv7);

export type DrizzleModelTypes<Model extends PgTable> = {
  Select: InferSelectModel<Model>;
  Insert: InferInsertModel<Model>;
};

export type Show<T> = {
  [K in keyof T]: T[K];
} & {};

// export const createTable = pgTableCreator(
//   (name) => `${Resource.App.name}_${name}`,
// );

export const createTable = pgTableCreator((name) => name);

export const clean = (input: string[]) =>
  input.map((item) => item.trim()).filter((item) => item);
