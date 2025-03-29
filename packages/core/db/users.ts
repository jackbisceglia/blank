import { db, userTable } from ".";

import { DrizzleError, eq } from "drizzle-orm";
import { User, UserInsert } from "./user.schema";
import { fromDrizzleThrowable } from "./utils";
import { ResultAsync } from "neverthrow";

type MaybeUser = User | undefined;
type DrizzleResult<T> = ResultAsync<T, DrizzleError>;

type Identifier =
  | {
      type: "email";
      value: string;
    }
  | {
      type: "id";
      value: string;
    };

export namespace users {
  function getByIdentifier(
    identifier: Identifier,
    ...returning: (keyof (typeof userTable)["$inferSelect"])[]
  ): DrizzleResult<MaybeUser> {
    const columns = returning.reduce((a, c) => ({ ...a, [c]: true }), {});

    const query = fromDrizzleThrowable(() =>
      db.query.userTable.findFirst({
        where: eq(userTable[identifier.type], identifier.value),
        columns: returning.length ? columns : undefined,
      })
    );

    return query();
  }

  export function getByEmail(email: string): DrizzleResult<MaybeUser> {
    return getByIdentifier({ type: "email", value: email }, "id");
  }

  export function getAuthenticatedUser(id: string): DrizzleResult<MaybeUser> {
    return getByIdentifier({ type: "id", value: id });
  }

  export function createUser(
    user: UserInsert
  ): DrizzleResult<Pick<User, "id">> {
    const query = fromDrizzleThrowable(() =>
      db.insert(userTable).values(user).returning({ id: userTable.id })
    );

    return query().map((ids) => ids[0]);
  }
}
