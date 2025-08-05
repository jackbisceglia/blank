import { Config, Effect, String } from "effect";
import { organization } from "../../../../modules/organization/entity";
import { OrganizationInsert } from "../../schema";

const User = {
  Email: Config.string("DEV_EMAIL").pipe(
    Config.validate({
      message: "Exected an email",
      validation: String.includes("@"),
    }),
  ),
};

export const createOrganizations = Effect.fn("createOrganizations")(
  function* () {
    const myEmail = yield* User.Email;

    const inserts = [
      { pattern: myEmail, plan: "pro" },
      {
        pattern: "*@withblank.com",
        plan: "pro",
      },
    ] satisfies OrganizationInsert[];

    return yield* Effect.forEach(
      inserts,
      Effect.fn("insert")(function* (insert) {
        return yield* organization.create(insert);
      }),
    );
  },
);
