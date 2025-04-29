import {
  computeListQueryStatus,
  useListQuery,
  useRecordQuery,
  useZero,
  Zero,
} from "@/lib/zero.provider";
import { constants } from "@/lib/utils";
import { DeleteGroupOptions } from "@/lib/data.mutators";
import { useAuthentication } from "@/lib/auth.provider";

const groupByProperty = (key: "slug" | "id", value: string, z: Zero) =>
  z.query.group
    .where(key, value)
    .one()
    .related("expenses")
    .related("members")
    .related("owner");

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

export function useCreateGroup() {
  const auth = useAuthentication();
  const z = useZero();

  return (title: string, description: string) =>
    z.mutate.group.create({
      description,
      title,
      userId: auth.user.id,
      username: auth.user.name,
    });
}

export function useDeleteGroup() {
  const z = useZero();

  return (options: DeleteGroupOptions) => z.mutate.group.delete(options);
}
