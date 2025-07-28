import { useZero, ZERO_CACHE_DEFAULT } from "@/lib/zero";
import { useRecordQuery } from "@/lib/zero";

export function useUserDefaultGroup(userId: string) {
  const z = useZero();

  return useRecordQuery(
    z.query.group
      .whereExists("members", (members) => members.where("userId", userId))
      .whereExists("defaults", (preference) =>
        preference.where("userId", userId),
      )
      .one(),
    ZERO_CACHE_DEFAULT,
  );
}
