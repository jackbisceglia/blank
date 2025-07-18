import { useZero } from "@/lib/zero";
import { RemoveMemberOptions, InviteMemberOptions } from "@/lib/client-mutators/member-mutators";

export function useRemoveMember() {
  const z = useZero();

  return (options: RemoveMemberOptions) => {
    return z.mutate.member.remove(options).client;
  };
}

export function useInviteMember() {
  const z = useZero();

  return (options: InviteMemberOptions) => {
    return z.mutate.member.invite(options).client;
  };
}