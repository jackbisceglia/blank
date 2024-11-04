import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { PgTable, pgTableCreator, text } from 'drizzle-orm/pg-core';
import { Resource } from 'sst';
import { uuidv7 as genUUIDv7 } from 'uuidv7';

export const uuidv7 = (columnName?: string) => text(columnName ?? 'id');

export const uuidv7Defaults = (columnName?: string) =>
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

export const transformEnumToArray = (categories: string) =>
  categories.split(',');
export const transformArrayToEnum = (categories: string[]) =>
  categories.join(',');

export function zodTransformSqliteEnumToArray<T>(
  obj: { categories: string | null } & Omit<T, 'categories'>,
) {
  if (!obj.categories)
    return {
      ...obj,
      categories: null,
    };

  return {
    ...obj,
    categories: transformEnumToArray(obj.categories),
  };
}

const clean = (input: string[]) =>
  input.map((item) => item.trim()).filter((item) => item);

export const toArray = (input: string) => clean(input.split(','));
export const toEnum = (input: string[]) => clean(input).join(',');
