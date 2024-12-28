import { Zero } from '@/lib/zero';
import { uuidv7 as genUUIDv7 } from 'uuidv7';

export function getTopLevelGroupDetailsByInviteLink(
  z: Zero,
  invitationId: string,
) {
  return z.query.group.where('invitationId', '=', invitationId).one();
}

export function joinGroup(
  z: Zero,
  groupId: string,
  userId: string,
  username: string,
) {
  const id = genUUIDv7();
  const shouldSetDefault =
    z.query.member.where('userId', userId).materialize().data.length === 0;

  void z.mutate.member.insert({
    id: id,
    groupId: groupId,
    userId: userId,
    nickname: username,
  });

  if (shouldSetDefault) {
    void z.mutate.preference.insert({
      userId,
      defaultGroupId: groupId,
    });
  }
}

export function getGroupMembersWhereUserIsAMember(
  z: Zero,
  groupId: string,
  userId: string,
) {
  return z.query.group
    .where('id', '=', groupId)
    .whereExists('members', (m) => m.where('userId', userId))
    .related('members')
    .one();
}
