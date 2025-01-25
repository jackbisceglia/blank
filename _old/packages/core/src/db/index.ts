import * as groups from './group.schema';
import * as members from './member.schema';
import * as preferences from './preference.schema';
import * as transactions from './transaction.schema';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Resource } from 'sst';

const { host, user, password, database } = Resource.DATABASE;

const schemas = {
  ...groups,
  ...members,
  ...preferences,
  ...transactions,
};

export const db = drizzle(
  neon(`postgresql://${user}:${password}@${host}/${database}`),
  {
    schema: schemas,
  },
);

// barrel exports
export * from './group.schema';
export * from './group';

export * from './member.schema';
export * from './member';

export * from './preference.schema';
export * from './preference';

export * from './transaction.schema';
export * from './transaction';
