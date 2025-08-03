import { Effect, Array, String, pipe, Config } from "effect";
import { users } from "../../../../modules/user/entity";
import { UserInsert } from "../../schema";
import _ from "./mock.json";

const handles = _.users.handles as string[];
const placeholder = _.users.image as string;

const User = {
  Email: Config.string("DEV_EMAIL").pipe(
    Config.validate({
      message: "Exected an email",
      validation: String.includes("@"),
    }),
  ),
  Name: Config.string("DEV_USERNAME").pipe(
    Config.validate({
      message: "Exected a valid username",
      validation: (s) => s.length < 64,
    }),
  ),
};

export const createUsers = Effect.fn("createUsers")(function* () {
  const meInsert = {
    email: yield* User.Email,
    name: yield* User.Name,
    image: placeholder,
    plan: "pro",
  } satisfies UserInsert;

  const restInserts = handles.map(
    (handle) =>
      ({
        image: placeholder,
        email: `${handle}@gmail.com`,
        name: pipe(
          handle,
          String.split("_"),
          (arr) =>
            Array.map(
              arr,
              arr.length > 1 ? String.capitalize : String.toLowerCase,
            ),
          Array.join(" "),
        ),
      }) satisfies UserInsert,
  );

  return yield* Effect.forEach(
    Array.prepend(restInserts, meInsert),
    Effect.fn("insert")(function* (insert) {
      return yield* users.create(insert);
    }),
  );
});
