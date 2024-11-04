import { getAuth } from '@hono/clerk-auth';
import { Context } from 'hono';
import { BlankEnv, BlankInput } from 'hono/types';

export const requireAuthenticated = (c: Context<BlankEnv, '/', BlankInput>) => {
  const auth = getAuth(c);
  console.log(auth);

  if (!auth?.userId) {
    throw new Error('You are not logged in.');
  }

  return auth;
};
