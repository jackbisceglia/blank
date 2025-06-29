import { Effect, Random, Array, pipe } from "effect";
import { User } from "../../schema";
import { slugify } from "../../../utils";
import { groups } from "../../../../modules";
import { members } from "../../../../modules/member/entity";
import _ from "./mock.json";

type MockUser = Pick<User, "name" | "id">;

type MockGroupTitle = string;
type MockGroupDescription = string;
type MockGroupMemberCount = number;
type Entry = [MockGroupTitle, MockGroupDescription, MockGroupMemberCount];

const data = _.groups as Entry[];

export const createGroups = Effect.fn("createGroups")(function* (
  me: MockUser,
  users: MockUser[],
) {
  return yield* Effect.forEach(
    data,
    Effect.fn("createMemberPerGroup")(function* (entry) {
      const [title, description, count] = entry;

      const groupToInsert = {
        title: title,
        description: description,
        ownerId: me.id,
        slug: slugify(title).encode(),
      };

      const groupCreated = yield* groups.create(groupToInsert);

      const membersToInsert = yield* pipe(
        Random.shuffle(users),
        Effect.map(Array.take(count - 1)),
        Effect.map(Array.prepend(me)),
        Effect.map(
          Array.map((member) => ({
            groupId: groupCreated.id,
            nickname: member.name,
            userId: member.id,
          })),
        ),
      );

      const membersCreated = yield* members.createMany(membersToInsert);

      return { group: groupCreated, members: membersCreated };
    }),
  );
});
