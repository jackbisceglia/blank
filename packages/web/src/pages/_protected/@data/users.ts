import { useZero, ZERO_CACHE_DEFAULT } from "@/lib/zero";
import { useRecordQuery } from "@/lib/zero";

export function useUserPreferences(userId: string) {
  const z = useZero();
  const query = z.query.preference.where("userId", userId).one();
  return useRecordQuery(query, ZERO_CACHE_DEFAULT);
}
