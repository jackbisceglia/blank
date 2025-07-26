import { useZero } from "@/lib/zero";
import {
  RemoveMemberOptions,
  UpdateMemberNicknameOptions,
} from "@/lib/client-mutators/member-mutators";

export function useRemoveMember() {
  const z = useZero();

  return (options: RemoveMemberOptions) => {
    return z.mutate.member.remove(options).client;
  };
}

export function useUpdateMemberNickname() {
  const z = useZero();

  return (options: UpdateMemberNicknameOptions) => {
    return z.mutate.member.updateNickname(options).client;
  };
}

