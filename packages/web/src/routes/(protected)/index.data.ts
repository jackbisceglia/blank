import { Zero } from '@/lib/zero';
import { uuidv7 as genUUIDv7 } from 'uuidv7';

function checkIsGroupOwner(ownerId: string, userId: string) {
  if (ownerId !== userId) {
    throw Error('not permitted to delete this group');
  }
}

export function getGroupsUserBelongsTo(z: Zero, userId: string) {
  return z.query.group
    .whereExists('members', (m) => m.where('userId', userId))
    .related('members');
}

export async function createGroup(
  z: Zero,
  title: string,
  username: string,
  userId: string,
) {
  const groupId = genUUIDv7();
  const numGroupsUserIsAMemberOf = getGroupsUserBelongsTo(
    z,
    userId,
  ).materialize().data.length;

  await z.mutate.group.insert({
    id: groupId,
    ownerId: userId,
    title: title,
  });

  await z.mutate.member.insert({
    groupId,
    userId,
    nickname: username,
  });

  if (numGroupsUserIsAMemberOf === 0) {
    await z.mutate.preference.insert({
      userId,
      defaultGroupId: groupId,
    });
  }
}

export async function generateGroupInviteLink(z: Zero, groupId: string) {
  const inviteId = genUUIDv7();

  await z.mutate.group.update({
    id: groupId,
    invitationId: inviteId,
  });
}

export async function updateGroup(
  z: Zero,
  groupId: string,
  groupOwnerId: string,
  userId: string,
  title: string,
) {
  checkIsGroupOwner(groupOwnerId, userId);

  // cascades ?
  await z.mutate.group.update({
    id: groupId,
    title: title,
  });
}

export async function deleteGroup(
  z: Zero,
  groupId: string,
  groupOwnerId: string,
  userId: string,
) {
  checkIsGroupOwner(groupOwnerId, userId);

  // cascades ?
  await z.mutateBatch(async (tx) => {
    await tx.group.delete({
      id: groupId,
    });
  });
}
