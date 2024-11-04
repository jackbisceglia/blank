import transactions from './transaction.routes';

import { clerkMiddleware } from '@hono/clerk-auth';
import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { logger } from 'hono/logger';

const app = new Hono({})
  .use('*', clerkMiddleware())
  .use('*', logger())
  .get('/', (c) => {
    return c.text('welcome to the blank api');
  })
  .route('/transactions', transactions);

export type AppType = typeof app;
export default handle(app);
