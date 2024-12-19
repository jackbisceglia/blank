import { requireAuthenticated } from './utils';

import { group } from '@blank/core/db';

import { Hono } from 'hono';

const api = new Hono().get('/', async (c) => {
  const auth = requireAuthenticated(c);

  // TODO: check that user is a member of this group
  const groupsByUserId = await group.getAllByUserId(auth.userId);

  return c.json(groupsByUserId);
});

export default api;
