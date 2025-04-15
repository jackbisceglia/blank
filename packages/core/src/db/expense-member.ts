import { err, ok } from "neverthrow";
import { db } from ".";
import { DrizzleResult, fromDrizzleThrowable } from "./utils";
import {
  ExpenseMember,
  ExpenseMemberInsert,
  expenseMemberTable,
} from "./expense-member.schema";

const Errors = {
  UnexpectedInsertCount: (ct: number) =>
    new Error(`Expected 1 expense to be inserted, but got ${ct.toString()}`),
};

export namespace expenseMembers {
  export function create(
    expenseMember: ExpenseMemberInsert
  ): DrizzleResult<ExpenseMember> {
    const safelyInsertExpenseRecord = fromDrizzleThrowable(() =>
      db.insert(expenseMemberTable).values(expenseMember).returning()
    );

    return safelyInsertExpenseRecord().andThen((ids) =>
      ids.length === 1
        ? ok(ids[0])
        : err(Errors.UnexpectedInsertCount(ids.length))
    );
  }

  export function createMany(
    expenseMembers: ExpenseMemberInsert[]
  ): DrizzleResult<ExpenseMember[]> {
    const safelyInsertExpenseRecord = fromDrizzleThrowable(() =>
      db.insert(expenseMemberTable).values(expenseMembers).returning()
    );

    return safelyInsertExpenseRecord().andThen((ids) =>
      ids.length === expenseMembers.length
        ? ok(ids)
        : err(Errors.UnexpectedInsertCount(ids.length))
    );
  }
}
