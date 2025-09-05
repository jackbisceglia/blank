import { useRouter } from "@tanstack/react-router";
import { Effect, Schema as S, Option } from "effect";
import p from "node:path";

export const RETURN_TO_KEY = "return_to";
export const ROOT = "/";
const CONTROL = /[\u0000-\u001F\u007F]/;

export const orElseRoot = Option.getOrElse(() => ROOT);

const annotate = (message: string) => ({
  message: () => `ReturnTo path ${message}`,
});

export function usePreserveReturnTo() {
  const { pathname, searchStr, hash } = useRouter().state.location;
  const fullpath = [pathname, searchStr, hash].join("");

  // no need to set the search param if it's just the root, it clutters the url
  if (fullpath === "/") return undefined;

  return fullpath;
}

export const sanitizeReturnTo = Effect.fn("sanitizeReturnTo")(function* (
  path?: string,
) {
  if (!path) return Option.none();

  const SchemaBase = S.String.pipe(
    S.trimmed(),
    S.minLength(1),
    S.startsWith("/", annotate("must begin with /.")),
    S.filter(
      (str) => !CONTROL.test(str),
      annotate("must not contain control characters."),
    ),
    S.filter(
      (str) => !str.includes("://"),
      annotate("must not contain full URLs."),
    ),
    S.filter(
      (str) => !str.startsWith("//"),
      annotate("must not contain protocol-relative URLs."),
    ),
    S.filter(
      (s) => !(s.startsWith("\\") || s.startsWith("/\\")),
      annotate("must not start with backslashes."),
    ),
  );

  const SchemaNormalized = S.transform(S.String, S.String, {
    decode: (s) => p.posix.normalize(s),
    encode: (s) => s,
  }).pipe(S.compose(SchemaBase));

  // first schema base, then schema normalized (which calls into base to re-run validations)
  return S.decodeUnknownOption(S.compose(SchemaBase, SchemaNormalized))(path);
});
