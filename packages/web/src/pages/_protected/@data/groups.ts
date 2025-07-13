import {
  useListQuery,
  useRecordQuery,
  useZero,
  Zero,
  ZERO_CACHE_DEFAULT,
} from "@/lib/zero";
import {
  DeleteGroupOptions,
  UpdateGroupOptions,
} from "@/lib/client-mutators/group-mutators";
import { useAuthentication } from "@/lib/authentication";

export const queries = {
  groupList(z: Zero, userId: string) {
    return z.query.group
      .whereExists("members", (members) => members.where("userId", userId))
      .orderBy("createdAt", "desc");
  },
  groupById(z: Zero, id: string) {
    return z.query.group
      .where("id", id)
      .related("expenses", (e) =>
        e
          .where("status", "active")
          .orderBy("date", "desc")
          .related("participants", (p) =>
            p.related("member").related("member"),
          ),
      )

      .related("members")
      .related("owner")
      .one();
  },
};

export function useGroupById(id: string) {
  const z = useZero();
  const query = queries.groupById(z, id);

  return useRecordQuery(query, ZERO_CACHE_DEFAULT);
}

export function useGroupListByUserId(userId: string) {
  const z = useZero();
  const query = queries.groupList(z, userId);

  return useListQuery(query, ZERO_CACHE_DEFAULT);
}

export function useCreateGroup() {
  const auth = useAuthentication();
  const z = useZero();

  return (title: string, description: string) => {
    const id = crypto.randomUUID();

    return z.mutate.group.create({
      id,
      description,
      title,
      userId: auth.user.id,
      nickname: auth.user.name,
    }).client;
  };
}

export function useUpdateGroup() {
  const z = useZero();

  return (options: UpdateGroupOptions) => {
    return z.mutate.group.update(options).client;
  };
}

export function useDeleteGroup() {
  const z = useZero();

  return (options: DeleteGroupOptions) => z.mutate.group.delete(options).client;
}
