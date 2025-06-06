import { Participant } from "@blank/zero";
import { Member } from "@blank/core/modules/member/schema";

export type ParticipantWithMember = Participant & {
  member: Member | undefined;
};

export function getPayerFromParticipants(
  participants: ParticipantWithMember[]
) {
  return participants.find((p) => p.role === "payer");
}

export type MemberBalanceTuple = readonly [Member, number];

// Custom sort order:
// 1. positive balances first, descending
// 2. negative balances next, descending by absolute value
// 3. zero balances last
export function compareParticipantsCustomOrder(
  [_memberA, a]: MemberBalanceTuple,
  [_memberB, b]: MemberBalanceTuple
) {
  if (a === b) return 0;

  // deprioritize 0s (shift right)
  if (a === 0 && b !== 0) return 1;
  if (b === 0 && a !== 0) return -1;

  // if both neg, prioritize higher abs values (shift left)
  if (a < 0 && b < 0) return Math.abs(b) - Math.abs(a);

  // this means we have a mix of pos/neg, or both pos
  // so we just push biggest values left
  return b - a;
}
