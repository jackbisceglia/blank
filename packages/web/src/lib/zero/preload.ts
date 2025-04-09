import { groupsListQuery } from "@/pages/_protected/groups/@data";
import { CACHE, useZero } from ".";

export function usePreload(userId: string) {
  const { z } = useZero();

  return () => groupsListQuery(z, userId).preload(CACHE.FOREVER);
}
