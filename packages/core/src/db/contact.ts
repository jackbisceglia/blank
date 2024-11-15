import { contactTable, db } from '.';

import { eq } from 'drizzle-orm';

export const contact = {
  getAllByUserId(id: string) {
    return db.query.contactTable.findMany({
      where: eq(contactTable.userId, id),
    });
  },
  async createByPhoneNumber(number: string, name: string, id: string) {
    const newContact = await db
      .insert(contactTable)
      .values({
        userId: id,
        phone: number,
        name: name,
      })
      .returning();

    return newContact;
  },
  async deleteById(id: string) {
    const deleted = await db
      .delete(contactTable)
      .where(eq(contactTable.id, id))
      .returning();

    return deleted;
  },
};
