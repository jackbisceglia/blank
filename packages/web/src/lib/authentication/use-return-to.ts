import { useRouter } from "@tanstack/react-router";

export function usePreserveReturnTo() {
  const { pathname, searchStr, hash } = useRouter().state.location;
  const fullpath = [pathname, searchStr, hash].join("");

  // no need to set the search param if it's just the root, it clutters the url
  if (fullpath === "/") return undefined;

  return fullpath;
}
