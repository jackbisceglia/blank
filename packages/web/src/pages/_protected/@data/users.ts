import { useZero, ZERO_CACHE_DEFAULT } from "@/lib/zero";
import { useRecordQuery } from "@/lib/zero";

export function useUserPreferences(userId: string) {
  const z = useZero();

  return useRecordQuery(
    z.query.preference.where("userId", userId).one(),
    ZERO_CACHE_DEFAULT,
  );
}
