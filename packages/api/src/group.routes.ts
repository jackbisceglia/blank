import { makeRequireReturnedRow, requireAuthenticated } from './utils';

import { generateUsername } from '@blank/core/ai';
import { group } from '@blank/core/db';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as z from 'zod';

const requireReturnedGroup = makeRequireReturnedRow('group');

const api = new Hono()
  .get(
    '/:id',
    zValidator(
      'param',
      z.object({
        id: z.string(),
      }),
    ),
    async (c) => {
      requireAuthenticated(c);

      // TODO: check that user is a member of this group

      const param = c.req.valid('param');

      const rows = await group.getById(param.id);

      // TODO: turn this into a separate check and throw that the group doesn't exist, this is fine for now
      const groupById = requireReturnedGroup(
        [rows].filter((row) => row !== undefined),
      );

      return c.json(groupById);
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        body: z.object({
          title: z.string().min(2).max(20),
          numGroupsUserIsAMemberOf: z.number().min(0).max(10),
        }),
      }),
    ),
    async (c) => {
      const auth = requireAuthenticated(c);

      const { body } = c.req.valid('json');

      // TODO: get name from clerk on the session claims
      const nickname = await generateUsername();

      const rows = await group.create(
        body.title,
        nickname,
        auth.userId,
        body.numGroupsUserIsAMemberOf,
      );

      const newGroup = requireReturnedGroup(rows);

      return c.json(newGroup);
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

      const rows = await group.deleteById(param.id);

      const deletedGroup = requireReturnedGroup(rows);

      return c.json(deletedGroup);
    },
  );

export default api;
