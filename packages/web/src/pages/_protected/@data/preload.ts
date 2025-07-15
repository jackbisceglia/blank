import { Zero } from "@/lib/zero";
import { queries } from "./groups";

const TTL = { ttl: "forever" } as const;

export async function preload(z: Zero, userId: string) {
  const groups = await queries.groupList(z, userId).run({ type: "complete" });

  for (const { id } of groups) {
    queries.groupById(z, id).preload(TTL);
  }
}
