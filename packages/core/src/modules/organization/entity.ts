// this is very naive on purpose for now

import { Effect, Array, String, Match, pipe } from "effect";
import {
  DatabaseReadError,
  DatabaseWriteError,
  Transaction,
} from "../../lib/drizzle/utils";
import { requireSingleElement, TaggedError } from "../../lib/effect";
import { db } from "../../lib/drizzle";
import { Organization, OrganizationInsert, organizationTable } from "./schema";

class OrganizationLookupError extends TaggedError("OrganizationLookupError") {}
class DuplicateOrganizationError extends TaggedError(
  "DuplicateOrganizationError",
) {}
class OrganizationNotCreatedError extends TaggedError(
  "OrganizationNotCreatedError ",
) {}

const constants = { wildcard: "*", at: "@" };

// an org will just be some email address pattern that we auto upgrade to pro
export namespace organization {
  export function create(org: OrganizationInsert, tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .insert(organizationTable)
          .values(org)
          .returning({ id: organizationTable.id }),
      ),
      Effect.flatMap(
        requireSingleElement({
          empty: () =>
            new OrganizationNotCreatedError("Organization not created"),
          success: (row) => row,
          dup: () =>
            new DuplicateOrganizationError("Duplicate organization found"),
        }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed creating user", e),
      ),
    );
  }

  export function removeAll(tx?: Transaction) {
    return pipe(
      Effect.tryPromise(() =>
        (tx ?? db)
          .delete(organizationTable)
          .returning({ id: organizationTable.id }),
      ),
      Effect.catchTag(
        "UnknownException",
        (e) => new DatabaseWriteError("Failed to remove organizations", e),
      ),
    );
  }

  export const belongsTo = Effect.fn("belongsTo")(
    function* (userEmail: string, tx?: Transaction) {
      const findMatchingPatterns = (row: Organization) => {
        type Segment = ReturnType<typeof segment>;

        const segment = (str: string) =>
          pipe(str, String.split(constants.at), ([username, domain]) => ({
            username,
            domain,
          }));

        const email = segment(userEmail);

        const predicates = {
          isExact: (pattern: Segment) =>
            pattern.domain === email.domain &&
            pattern.username === email.username,
          isWildcard: (pattern: Segment) =>
            pattern.username === constants.wildcard,
        };

        return Match.value(segment(row.pattern)).pipe(
          Match.when(predicates.isExact, () => true),
          Match.when(
            predicates.isWildcard,
            (pattern) => email.domain === pattern.domain,
          ),
          Match.orElse(() => false),
        );
      };

      const rows = yield* Effect.tryPromise(() =>
        (tx ?? db).query.organizationTable.findMany(),
      );

      const matches = Array.filter(rows, (row) => findMatchingPatterns(row));

      if (matches.length === 0) {
        return yield* new OrganizationLookupError(
          "User does not belong to any organizations",
        );
      }

      return matches;
    },
    Effect.catchTags({
      UnknownException: (e) =>
        new DatabaseReadError("Failed fetching user by email", e),
    }),
  );

  export const prioritize = Effect.fn("prioritize")(function* (
    orgs: Organization[],
  ) {
    const priorities = [
      "base",
      "pro",
    ] as const satisfies Organization["plan"][];

    const topScore = Array.reduce(orgs, 0, (top, current) => {
      const index = priorities.indexOf(current.plan);

      return index > top ? index : top;
    });

    return priorities[topScore];
  });
}
