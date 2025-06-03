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
