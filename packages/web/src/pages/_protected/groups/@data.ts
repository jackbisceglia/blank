import {
  useListQuery,
  useRecordQuery,
  useZero,
  Zero,
} from "@/lib/zero.provider";
import { constants } from "@/lib/utils";
import { DeleteGroupOptions } from "@/lib/mutators/group-mutators";
import { useAuthentication } from "@/lib/auth.provider";

const groupByProperty = (key: "slug" | "id", value: string, z: Zero) =>
  z.query.group
    .where(key, value)
    .related("expenses", (e) =>
      e.related("participants", (p) => p.related("member").related("member"))
    )
    .related("members")
    .related("owner")
    .one();

export function useGetGroupBySlug(slug: string) {
  const z = useZero();
  const query = groupByProperty("slug", slug, z);

  const result = useRecordQuery(query, { ttl: constants.zero_ttl });

  return result;
}

export function useGetGroupById(id: string) {
  const z = useZero();
  const query = groupByProperty("id", id, z);

  const result = useRecordQuery(query, { ttl: constants.zero_ttl });

  return result;
}

export function useGetGroupsList(userId: string) {
  const z = useZero();
  const query = z.query.group
    .whereExists("members", (members) => members.where("userId", userId))
    .orderBy("createdAt", "desc");

  const result = useListQuery(query, { ttl: constants.zero_ttl });

  return result;
}

export function useGetExpenseListByGroupSlug(
  slug: string,
  filters?: {
    query?: string;
  }
) {
  const z = useZero();
  let query = z.query.expense
    .whereExists("group", (g) => g.where("slug", slug))
    .orderBy("date", "desc")
    .related("participants", (p) => p.related("member").related("member"));

  if (filters?.query) {
    query = query.where("description", "ILIKE", `%${filters.query}%`);
  }

  return useListQuery(query, { ttl: constants.zero_ttl });
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
