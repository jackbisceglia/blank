import { db, userTable } from ".";

import { eq } from "drizzle-orm";
import { User, UserInsert } from "./user.schema";
import { DrizzleResult, fromDrizzleThrowable } from "./utils";
import { err, ok } from "neverthrow";

const Errors = {
  UnexpectedInsertCount: (ct: number) =>
    new Error(`Expected 1 user to be inserted, but got ${ct.toString()}`),
};

type MaybeUser = User | undefined;

type Identifier =
  | {
      type: "email";
      value: string;
    }
  | {
      type: "id";
      value: string;
    };

function getByIdentifier(
  identifier: Identifier,
  ...returning: (keyof (typeof userTable)["$inferSelect"])[]
): DrizzleResult<MaybeUser> {
  const columns = returning.reduce((a, c) => ({ ...a, [c]: true }), {});

  const safeQuery = fromDrizzleThrowable(() =>
    db.query.userTable.findFirst({
      where: eq(userTable[identifier.type], identifier.value),
      columns: returning.length ? columns : undefined,
    })
  );

  return safeQuery();
}

export namespace users {
  export function getByEmail(email: string): DrizzleResult<MaybeUser> {
    return getByIdentifier({ type: "email", value: email }, "id");
  }

  export function getAuthenticatedUser(id: string): DrizzleResult<MaybeUser> {
    return getByIdentifier({ type: "id", value: id });
  }

  export function create(user: UserInsert): DrizzleResult<Pick<User, "id">> {
    const safelyInsertUserRecord = fromDrizzleThrowable(() =>
      db.insert(userTable).values(user).returning({ id: userTable.id })
    );

    return safelyInsertUserRecord().andThen((ids) =>
      ids.length === 1
        ? ok(ids[0])
        : err(Errors.UnexpectedInsertCount(ids.length))
    );
  }
}
