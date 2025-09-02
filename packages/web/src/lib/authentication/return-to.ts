import { useRouter } from "@tanstack/react-router";

export const RETURN_TO_KEY = "return_to";
export const ROOT = "/";

export function usePreserveReturnTo() {
  const { pathname, searchStr, hash } = useRouter().state.location;
  const fullpath = [pathname, searchStr, hash].join("");

  // no need to set the search param if it's just the root, it clutters the url
  if (fullpath === "/") return undefined;

  return fullpath;
}

export function sanitizeReturnTo(path?: string): string | undefined {
  if (!path) return undefined;
  // Disallow protocol-relative and absolute URLs
  if (path.startsWith("//")) return undefined;
  if (path.includes("://")) return undefined;
  // Require leading slash
  if (!path.startsWith("/")) return undefined;
  return path;
}
