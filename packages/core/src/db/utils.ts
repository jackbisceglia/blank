import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { PgTable, pgTableCreator, text } from 'drizzle-orm/pg-core';
import { Resource } from 'sst';
import { uuidv7 as genUUIDv7 } from 'uuidv7';

export const uuidv7 = (columnName?: string) => text(columnName ?? 'id');

export const uuidv7WithDefault = (columnName?: string) =>
  uuidv7(columnName ?? 'id').$defaultFn(genUUIDv7);

export type DrizzleModelTypes<Model extends PgTable> = {
  Select: InferSelectModel<Model>;
  Insert: InferInsertModel<Model>;
};

export type Show<T> = {
  [K in keyof T]: T[K];
} & {};

export const createTable = pgTableCreator(
  (name) => `${Resource.App.name}_${name}`,
);

export const clean = (input: string[]) =>
  input.map((item) => item.trim()).filter((item) => item);
