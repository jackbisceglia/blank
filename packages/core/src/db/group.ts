import { db, groupTable, memberTable, preferenceTable } from '.';

import { and, eq } from 'drizzle-orm';

export const group = {
  async create(
    title: string,
    nickname: string,
    userId: string,
    numGroupsUserIsAMemberOf: number,
  ) {
    const groupRowsCreated = await db
      .insert(groupTable)
      .values({ title, ownerId: userId })
      .returning();

    const groupRow = groupRowsCreated[0];

    // insert self as member (and owner)
    const memberRowsCreated = await db
      .insert(memberTable)
      .values({
        userId: userId,
        groupId: groupRowsCreated[0].id,
        nickname: nickname,
      })
      .returning();

    if (numGroupsUserIsAMemberOf === 0) {
      await db.insert(preferenceTable).values({
        userId,
        defaultGroupId: groupRow.id,
      });
    }

    return [
      {
        ...groupRow,
        members: memberRowsCreated,
      },
    ];
  },
  getById(id: string) {
    return db.query.groupTable.findFirst({
      where: eq(groupTable.id, id),
      with: {
        members: {
          columns: {
            nickname: true,
            userId: true,
          },
        },
      },
    });
  },
  getAllByUserId(userId: string) {
    return db.query.groupTable.findMany({
      where: (groups, { exists, eq }) => {
        return exists(
          db
            .select()
            .from(memberTable)
            .where(
              and(
                eq(memberTable.userId, userId),
                eq(memberTable.groupId, groups.id),
              ),
            ),
        );
      },
      with: {
        members: {
          columns: {
            nickname: true,
            userId: true,
          },
        },
      },
    });
  },
  hasUserAsMember(groupId: string, userId: string) {
    return db.query.groupTable.findFirst({
      where: (groups, { exists, eq }) => {
        return exists(
          db
            .select()
            .from(memberTable)
            .where(
              and(
                eq(memberTable.userId, userId),
                eq(memberTable.groupId, groupId),
              ),
            ),
        );
      },
    });
  },
  deleteById(id: string) {
    return db.delete(groupTable).where(eq(groupTable.id, id)).returning();
  },
};
