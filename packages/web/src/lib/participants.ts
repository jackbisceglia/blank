import { Participant } from "@blank/zero";
import { Member } from "@blank/core/db";

export type ParticipantWithMember = Participant & {
  member: Member | undefined;
};

export function getPayerFromParticipants(
  participants: ParticipantWithMember[]
) {
  return participants.find((p) => p.role === "payer")?.userId;
}

export function assertParticipantsHaveMembers(
  participants: ParticipantWithMember[]
) {
  const truthy = participants.filter((p) => !!p.member) as Array<
    ParticipantWithMember & { member: Member }
  >;

  if (truthy.length !== participants.length) {
    throw new Error("All articipants must have members");
  }

  return truthy as Array<ParticipantWithMember & { member: Member }>;
}
