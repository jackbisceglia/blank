import { Zero } from '@/lib/zero';

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
  const shouldSetDefault =
    z.query.member.where('userId', userId).materialize().data.length === 0;

  void z.mutate.member.insert({
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

export function getUserIsMemberByInvitationId(
  z: Zero,
  invitationId: string,
  userId: string,
) {
  return z.query.group
    .where('invitationId', '=', invitationId)
    .whereExists('members', (m) => m.where('userId', userId))
    .related('members');
}

export function getGroupByInvitationId(z: Zero, invitationId: string) {
  return z.query.group.where('invitationId', '=', invitationId);
}
