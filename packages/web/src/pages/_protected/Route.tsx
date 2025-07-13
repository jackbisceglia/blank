import { authenticationQueryOptions } from "@/lib/authentication";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";
import { SearchRouteSchema as GlobalSearchParams } from "./@command-bar.dialog";
import { SearchRouteSchema as CreateExpenseSearchParams } from "./@create-expense.dialog";
import { Preload } from "./@data/preload";
import { SearchRouteSchema as CreateGroupSearchParams } from "./groups/@create-group.dialog";
import { Providers, ProtectedLayout } from "./layout";

export const Route = createFileRoute("/_protected/Route")({
  loader: (opts) => {
    void opts.context.queryClient.ensureQueryData(authenticationQueryOptions());
  },
  component: () => (
    <Providers>
      <Preload />
      <ProtectedLayout />
    </Providers>
  ),
  validateSearch: v.object({
    // here we define search params for ui that can be shown globally
    action: v.optional(
      v.array(
        v.union([
          GlobalSearchParams.entries.action,
          CreateGroupSearchParams.entries.action,
          CreateExpenseSearchParams.entries.action,
        ]),
      ),
    ),
  }),
});
