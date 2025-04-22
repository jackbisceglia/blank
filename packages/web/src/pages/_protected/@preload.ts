import { CACHE, useZero } from "@/lib/zero.provider";
import { groupsListQuery } from "@/pages/_protected/groups/@data";

export function usePreload(userId: string) {
  const { z } = useZero();

  return () => groupsListQuery(z, userId).preload(CACHE.FOREVER);
}
