import {
  useListQuery,
  useRecordQuery,
  useZero,
  Zero,
  ZERO_CACHE_DEFAULT,
} from "@/lib/zero";
import { DeleteGroupOptions } from "@/lib/client-mutators/group-mutators";
import { useAuthentication } from "@/lib/authentication";

const groupByProperty = (key: "slug" | "id", value: string, z: Zero) =>
  z.query.group
    .where(key, value)
    .related("expenses", (e) =>
      e.related("participants", (p) => p.related("member").related("member"))
    )
    .related("members")
    .related("owner")
    .one();

export function useGroupById(id: string) {
  const z = useZero();
  const query = groupByProperty("id", id, z);

  const result = useRecordQuery(query, ZERO_CACHE_DEFAULT);

  return result;
}

export function useGroupBySlug(slug: string) {
  const z = useZero();
  const query = groupByProperty("slug", slug, z);

  const result = useRecordQuery(query, ZERO_CACHE_DEFAULT);

  return result;
}

export function useGroupListByUserId(userId: string) {
  const z = useZero();
  const query = z.query.group
    .whereExists("members", (members) => members.where("userId", userId))
    .orderBy("createdAt", "desc");

  const result = useListQuery(query, ZERO_CACHE_DEFAULT);

  return result;
}

export function useCreateGroup() {
  const auth = useAuthentication();
  const z = useZero();

  return (title: string, description: string) =>
    z.mutate.group.create({
      description,
      title,
      userId: auth.user.id,
      nickname: auth.user.name,
    });
}

export function useDeleteGroup() {
  const z = useZero();

  return (options: DeleteGroupOptions) => z.mutate.group.delete(options);
}
