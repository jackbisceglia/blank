import { createStackableSearchRoute } from "@/lib/search-route";
import * as v from "valibot";
import { templates } from "./templates";

const constants = {
  key: "action",
  entry: "new-group",
} as const;

const siblings = {
  template: v.picklist(Object.values(templates).map((v) => v.title)),
};

export type CreateGroupSearchRouteSchema = v.InferOutput<
  typeof CreateGroupSearchRouteSchema
>;

export const CreateGroupSearchRouteSchema = v.object({
  [constants.key]: v.literal(constants.entry),
  ...siblings,
});

const SearchRoute = createStackableSearchRoute(constants.key, constants.entry, {
  siblingKeys: Object.keys(siblings),
});

export default SearchRoute;
