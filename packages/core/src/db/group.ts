import { eq } from "drizzle-orm";
import { db, Member } from ".";
import { groupTable } from "./group.schema";
import { DrizzleResult, fromDrizzleThrowable } from "./utils";
import { err, ok } from "neverthrow";

const Errors = {
  NoMembersFound: () => new Error("No members found"),
};

export namespace groups {
  export function getMembers(groupId: string): DrizzleResult<Member[]> {
    const safelyInsertgroupRecord = fromDrizzleThrowable(() =>
      db.query.groupTable.findFirst({
        where: eq(groupTable.id, groupId),
        with: {
          members: true,
        },
        columns: {},
      })
    );

    return safelyInsertgroupRecord().andThen((group) => {
      return !group || group.members.length === 0
        ? err(Errors.NoMembersFound())
        : ok(group.members);
    });
  }
}
