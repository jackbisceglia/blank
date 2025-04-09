import {
  computeListQueryStatus,
  computeRecordQueryStatus,
  useZero,
  Zero,
} from "@/lib/zero";
import { constants, slug } from "@/lib/utils";
import { Group } from "@blank/zero";

export type CreateGroupDerivedOpts = Pick<Group, "title" | "description">;
export type DeleteGroupDerivedOpts = Pick<Group, "id" | "ownerId">;

export const groupBySlugQuery = (z: Zero, slug: string) =>
  z.query.group.where("slug", slug).one();

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

export function useCreateGroup(userId: string, username: string) {
  const { z } = useZero();

  return async (opts: CreateGroupDerivedOpts) => {
    const groupId = crypto.randomUUID();
    await z.mutate.group.insert({
      id: groupId,
      title: opts.title,
      slug: slug(opts.title).encode(),
      description: opts.description,
      ownerId: userId,
      createdAt: Date.now(),
    });

    await z.mutate.member.insert({
      groupId,
      userId,
      nickname: username,
    });
  };
}

export function useDeleteGroup() {
  const { z } = useZero();

  return async (opts: DeleteGroupDerivedOpts) => {
    // TODO: if any members have this group in preferences, then we need to remove from there as well
    await z.mutate.group.delete({ id: opts.id });

    await z.mutate.member.delete({ groupId: opts.id, userId: opts.ownerId });

    // NOTE: this is not the right way to do this, will be fixed w/ custom mutators
    // const expenses = (
    //   await z.query.expense.where("groupId", opts.id).run()
    // ).map((e) => e.id);
    // for (const expenseId of expenses) {
    //   await z.mutate.expense.delete({ id: expenseId });
    // }

    return { success: true };
  };
}
