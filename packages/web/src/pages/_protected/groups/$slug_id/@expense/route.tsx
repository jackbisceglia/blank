import { createSearchRoute } from "@/lib/search-route";
import * as v from "valibot";

export const constants = {
  key: "expense",
} as const;

export const ExpenseSheetSearchRouteSchema = v.object({
  [constants.key]: v.optional(v.string()),
});

const SearchRoute = createSearchRoute(constants.key);

export default SearchRoute;
