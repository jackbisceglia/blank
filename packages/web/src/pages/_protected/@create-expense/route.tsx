import { createStackableSearchRoute } from "@/lib/search-route";
import * as v from "valibot";

const constants = {
  key: "action",
  entry: "new-expense",
};

export type CreateExpenseSearchRouteSchema = v.InferOutput<
  typeof CreateExpenseSearchRouteSchema
>;

export const CreateExpenseSearchRouteSchema = v.object({
  [constants.key]: v.literal(constants.entry),
});

const SearchRoute = createStackableSearchRoute(constants.key, constants.entry);

export default SearchRoute;
