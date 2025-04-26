import {
  computeListQueryStatus,
  computeRecordQueryStatus,
  useZero,
  Zero,
} from "@/lib/zero.provider";
import { constants } from "@/lib/utils";
import { CreateGroupOptions, DeleteGroupOptions } from "@/lib/data.mutators";

export const groupBySlugQuery = (z: Zero, slug: string) =>
  z.query.group
    .where("slug", slug)
    .one()
    .related("members")
    .related("owner")
    .related("expenses");

export function useGetGroupBySlug({ slug }: { slug: string }) {
  const { z, useQuery } = useZero();
  const query = groupBySlugQuery(z, slug);

  const [data, status] = useQuery(query, { ttl: constants.zero_ttl });

  return {
    data,
    // TODO: we can improve the typescript so that data narrows to non-nullish when status === 'success'
    status: computeRecordQueryStatus(status.type, data),
  } as const;
}

export const groupsListQuery = (z: Zero, userId: string) =>
  z.query.group
    .whereExists("members", (members) => members.where("userId", userId))
    .orderBy("createdAt", "desc");

export function useGetGroupsList(userId: string) {
  const { z, useQuery } = useZero();
  const query = groupsListQuery(z, userId);

  const [data, status] = useQuery(query, { ttl: constants.zero_ttl });

  return {
    data,
    // TODO: we can improve the typescript so that data narrows to non-nullish when status === 'success'
    status: computeListQueryStatus(status.type, data),
  } as const;
}

export const getGroupByIdQuery = (z: Zero, groupId: string) =>
  z.query.group
    .where("id", groupId)
    .related("members")
    .related("owner")
    .related("owner");

export function useGetGroupById(groupId: string) {
  const { z, useQuery } = useZero();
  const query = getGroupByIdQuery(z, groupId);

  const [data, status] = useQuery(query, { ttl: constants.zero_ttl });

  return {
    data,
    // TODO: we can improve the typescript so that data narrows to non-nullish when status === 'success'
    status: computeListQueryStatus(status.type, data),
  } as const;
}

export const groupMembersListQuery = (z: Zero, groupId: string) =>
  z.query.group.where("id", groupId).related("members");

export function useGetGroupMembers(groupId: string) {
  const { z, useQuery } = useZero();
  const query = groupMembersListQuery(z, groupId);

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
