import * as v from "valibot";

export const Tokens = v.object({
  access: v.string(),
  refresh: v.string(),
});

export type Tokens = v.InferOutput<typeof Tokens>;

const AccessToken = Tokens.entries.access;
export type AccessToken = v.InferOutput<typeof AccessToken>;

const RefreshToken = Tokens.entries.refresh;
export type RefreshToken = v.InferOutput<typeof RefreshToken>;
