import { useGetGroupBySlug } from "@/pages/_protected/groups/@data";
import { getRouteApi } from "@tanstack/react-router";

function useGroupSlug() {
  try {
    const route = getRouteApi("/_protected/groups/$slug/");

    return route.useParams().slug;
  } catch {
    return undefined;
  }
}

export function useActiveGroup() {
  const slug = useGroupSlug();
  const result = useGetGroupBySlug(slug ?? "");

  return result.data;
}
