import { getAuth } from '@hono/clerk-auth';
import { Context } from 'hono';
import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { BlankEnv, BlankInput } from 'hono/types';

import { setTimeout } from 'timers/promises';

export const requireAuthenticated = (c: Context<BlankEnv, '/', BlankInput>) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    throw new Error('You are not logged in.');
  }

  return auth;
};

const returnedRows = <T>(rows: T[], entity: string) => {
  if (!rows.length) {
    throw new Error(`Failed to return ${entity}`);
  }

  return rows;
};

const returnedRow = <T>(rows: T[], entity: string) => {
  const all = returnedRows(rows, entity);

  return all[0];
};

export const makeRequireReturnedRows =
  (entity: string) =>
  <T>(rows: T[]) =>
    returnedRows(rows, entity);

export const makeRequireReturnedRow =
  (entity: string) =>
  <T>(rows: T[]) =>
    returnedRow(rows, entity);

export type DevConfig = {
  delay:
    | false
    | {
        time: number | undefined;
      };
};

// note: this is a bit of a hack- we take the context from the route as it's typed properly,
// while the middleware default context doesn't match the env() expected type
export const dev = (config: DevConfig) =>
  createMiddleware(async (c: Context<BlankEnv, '/', BlankInput>, next) => {
    const { DEVELOPMENT } = env<{ DEVELOPMENT: string }>(c);

    if (DEVELOPMENT === 'true') {
      if (config.delay) {
        const fallback = 3000;

        await setTimeout(config.delay.time ?? fallback);
      }
    }

    await next();
  });
