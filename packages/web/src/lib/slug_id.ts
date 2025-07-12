import { fromParsedEffect, TaggedError } from "@blank/core/lib/effect/index";
import { Effect, Match, pipe, Array, String } from "effect";
import * as v from "valibot";

const Params = v.object({
  slug_id: v.object({
    id: v.pipe(v.string(), v.uuid()),
    slug: v.string(),
  }),
});

class InvalidPathParamError extends TaggedError("InvalidSlugIdFormatError") {}
const SEPARATOR = "_";

type Params = {
  Stringify: {
    slug_id: {
      id: string;
      slug: string;
    };
  };
  Parse: {
    slug_id: string;
  };
};

export const transformSlugAndId = {
  parse: (params: Params["Parse"]) => {
    return pipe(
      Effect.succeed(Array.reverse(String.split(params["slug_id"], SEPARATOR))),
      Effect.flatMap((parts) =>
        pipe(
          parts,
          Match.value,
          Match.when(
            (parts) => parts.length >= 2,
            (parts) => Effect.succeed(parts),
          ),
          Match.orElse(() =>
            Effect.fail(
              new InvalidPathParamError("Path must contain slug and id"),
            ),
          ),
          Effect.map(([id, ...slugParts]) => ({
            id: id,
            slug: slugParts.join(""),
          })),
          Effect.andThen((data) =>
            fromParsedEffect(Params.entries.slug_id, data),
          ),
          Effect.map((data) => ({ slug_id: data })),
        ),
      ),
      Effect.runSync,
    );
  },
  stringify: (params: Params["Stringify"]) => ({
    slug_id: `${params["slug_id"]?.slug}_${params["slug_id"]?.id}`,
  }),
};
