import groups from './group.routes';
import transactions from './transaction.routes';
import users from './user.routes';
import { DevConfig, dev } from './utils';

import { clerkMiddleware } from '@hono/clerk-auth';
import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { logger } from 'hono/logger';

const config: DevConfig = {
  delay: false,
  // delay: {
  //   delay: 3000
  // },
};

const app = new Hono({})
  .use('*', dev(config))
  .use('*', logger())
  .use('*', clerkMiddleware())
  .get('/', (c) => {
    return c.text('welcome to the blank api');
  })
  .route('/transactions', transactions)
  .route('/groups', groups)
  .route('/users', users);

export type AppType = typeof app;
export default handle(app);
