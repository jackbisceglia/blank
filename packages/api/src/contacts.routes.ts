import { requireAuthenticated } from './utils';

import { contact } from '@blank/core/db';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as z from 'zod';

const api = new Hono()
  .get('/', async (c) => {
    const auth = requireAuthenticated(c);

    const all = await contact.getAllByUserId(auth.userId);

    return c.json(all);
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        body: z.object({
          // vv prob need to rework this vv
          name: z.string().min(2).max(20),
          phone: z.string().length(10),
        }),
      }),
    ),
    async (c) => {
      const auth = requireAuthenticated(c);

      const { body } = c.req.valid('json');

      const newContact = await contact.createByPhoneNumber(
        body.phone,
        body.name,
        auth.userId,
      );

      if (!newContact.length) {
        throw new Error('Failed to create contact');
      }

      return c.json(newContact[0]);
    },
  )
  .delete(
    '/:id',
    zValidator(
      'param',
      z.object({
        id: z.string(),
      }),
    ),
    async (c) => {
      requireAuthenticated(c);

      const param = c.req.valid('param');

      const rows = await contact.deleteById(param.id);

      if (!rows.length) {
        throw new Error('Failed to create contact');
      }

      const deletedContact = rows[0];

      return c.json(deletedContact);
    },
  );

export default api;
