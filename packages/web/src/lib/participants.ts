import { Participant } from "@blank/zero";
import { Member } from "@blank/core/modules/member/schema";

export type ParticipantWithMember = Participant & {
  member: Member | undefined;
};

export function getPayerFromParticipants(
  participants: ParticipantWithMember[]
) {
  return participants.find((p) => p.role === "payer")?.userId;
}
