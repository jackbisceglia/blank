import * as contacts from './contact.schema';
import * as transactions from './transaction.schema';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Resource } from 'sst';

const { host, user, password, database } = Resource.DATABASE;

const schemas = {
  ...transactions,
  ...contacts,
};

export const db = drizzle(
  neon(`postgresql://${user}:${password}@${host}/${database}`),
  {
    schema: schemas,
  },
);

// barrel exports
export * from './transaction.schema';
export * from './transaction';

export * from './contact.schema';
export * from './contact';
