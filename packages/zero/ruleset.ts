import { Condition, ExpressionBuilder, Query } from "@rocicorp/zero";
import { AuthData, Schema } from "./schema";

// UTILITIES
type AllNonNull<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

type Tables = keyof Schema["tables"];
type Expression<T extends Tables> = ExpressionBuilder<Schema, T>;

type PermissionFn = <TTable extends Tables>(
  authentication: AuthData,
  expression: Expression<TTable>,
) => Condition;

type PermissionFnDef<
  TTable extends Tables,
  Auth extends AuthData = AuthData,
> = (authentication: Auth, expression: Expression<TTable>) => Condition;

function createRule<T extends Tables>(fn: PermissionFnDef<T>) {
  return fn as PermissionFn;
}

function createRuleWithAuthCheck<T extends Tables>(
  fn: PermissionFnDef<T, AllNonNull<AuthData>>,
) {
  function withAuthCheck(authentication: AuthData, expression: Expression<T>) {
    if (!authentication.sub) {
      throw new Error("Must first check user is authenticated");
    }

    return fn(authentication as AllNonNull<typeof authentication>, expression);
  }

  return withAuthCheck as PermissionFn;
}

type RelationFn<TTable extends Tables> = (
  authentication: AllNonNull<AuthData>,
  relation: Query<Schema, TTable>,
) => Query<Schema, TTable>;

function relation<T extends Tables>(fn: RelationFn<T>) {
  return function (authentication: AuthData) {
    return function (relation: Query<Schema, T>) {
      if (!authentication.sub) {
        throw new Error("Must first check user is authenticated");
      }

      return fn(authentication as AllNonNull<typeof authentication>, relation);
    };
  };
}

const isMember = relation<"member">((authentication, member) =>
  member.where("userId", authentication.sub),
);

const isCoMember = relation<"group">((authentication, group) =>
  group.whereExists("members", isMember(authentication)),
);

export function useRuleSet(...keys: Array<keyof typeof RULES>) {
  const build = <TTable extends Tables>(
    authentication: AuthData,
    expression: Expression<TTable>,
  ) => {
    return expression.and(
      ...keys.map((key) => RULES[key](authentication, expression)),
    );
  };

  return [build];
}

// RULESET
const MustBeAuthenticated = createRule((authentication, expression) => {
  return expression.cmpLit(authentication.sub, "IS NOT", null);
});

const MustBeGroupMember = createRuleWithAuthCheck<"group">(
  function (authentication, group) {
    return group.exists("members", isMember(authentication));
  },
);

const MustBeCoMemberExpense = createRuleWithAuthCheck<"expense">(
  function (authentication, expression) {
    return expression.exists("group", isCoMember(authentication));
  },
);

const MustBeCoMember = createRuleWithAuthCheck<"member">(
  function (authentication, expression) {
    return expression.exists("group", isCoMember(authentication));
  },
);

const MustBeCoMemberParticipant = createRuleWithAuthCheck<"participant">(
  function (authentication, expression) {
    return expression.exists("member", (member) =>
      member.whereExists("group", isCoMember(authentication)),
    );
  },
);

const MustBePreferenceOwner = createRuleWithAuthCheck<"preference">(
  function (authentication, expression) {
    return expression.cmp("userId", authentication.sub);
  },
);

const RULES = {
  MustBeAuthenticated,
  MustBeGroupMember,
  MustBeCoMember,
  MustBeCoMemberExpense,
  MustBePreferenceOwner,
  MustBeCoMemberParticipant,
} as const satisfies Record<string, PermissionFn>;
