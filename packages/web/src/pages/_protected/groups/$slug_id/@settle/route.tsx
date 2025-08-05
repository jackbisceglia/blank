import { createStackableSearchRoute } from "@/lib/search-route";
import * as v from "valibot";

export type Step = `${typeof constants.prefix}-${number}`;

export const constants = {
  key: "settle",
  prefix: "step",
  steps: {
    one: "step-1",
    two: "step-2",
  },
} as const;

export const SearchRouteStep1 = createStackableSearchRoute(
  constants.key,
  constants.steps.one,
);
export const SearchRouteStep2 = createStackableSearchRoute(
  constants.key,
  constants.steps.two,
);

export const SearchRouteSchema = v.object({
  [constants.key]: v.optional(
    v.fallback(
      v.array(
        v.union([
          v.literal<Step>(constants.steps.one),
          v.literal<Step>(constants.steps.two),
        ]),
      ),
      [constants.steps.two],
    ),
  ),
});
