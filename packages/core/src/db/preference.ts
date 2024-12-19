import { db, preferenceTable } from '.';

import { eq } from 'drizzle-orm';

export const preference = {
  getDefaultGroupId: (userId: string) => {
    return db.query.preferenceTable.findFirst({
      where: eq(preferenceTable.userId, userId),
    });
  },
};
