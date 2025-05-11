import * as v from "valibot";
import { GlobalSearchParams } from "./@command-bar";
import { CreateExpenseSearchParams } from "./@create-expense";
import { CreateGroupSearchParams } from "./groups/@create-group";

export const SearchParams = v.object({
  action: v.optional(
    v.array(
      v.union([
        GlobalSearchParams.entries.action,
        CreateGroupSearchParams.entries.action,
        CreateExpenseSearchParams.entries.action,
      ])
    )
  ),
});

export type SearchParamActionValues =
  (typeof SearchParams.entries.action.wrapped.item.options)[number]["literal"];
