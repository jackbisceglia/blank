import {
  computeListQueryStatus,
  computeRecordQueryStatus,
  useZero,
} from "@/lib/zero.provider";
import { constants } from "@/lib/utils";
import { CreateGroupOptions, DeleteGroupOptions } from "@/lib/data.mutators";

export function useGetGroup(identifier: string, type?: "slug" | "id") {
  const { z, useQuery } = useZero();

  const query = z.query.group
    .where(type ?? "id", identifier)
    .one()
    .related("expenses")
    .related("members")
    .related("owner");

  const [data, status] = useQuery(query, { ttl: constants.zero_ttl });

  return {
    data,
    status: computeRecordQueryStatus(status.type, data),
  } as const;
}

export function useGetGroupsList(userId: string) {
  const { z, useQuery } = useZero();
  const query = z.query.group
    .whereExists("members", (members) => members.where("userId", userId))
    .orderBy("createdAt", "desc");

  const [data, status] = useQuery(query, { ttl: constants.zero_ttl });

  return {
    data,
    // TODO: we can improve the typescript so that data narrows to non-nullish when status === 'success'
    status: computeListQueryStatus(status.type, data),
  } as const;
}

export function useCreateGroup() {
  const client = useZero();

  return (opts: CreateGroupOptions) => client.z.mutate.group.create(opts);
}

export function useDeleteGroup() {
  const client = useZero();

  return (options: DeleteGroupOptions) => client.z.mutate.group.delete(options);
}
