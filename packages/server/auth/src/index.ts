import { issuer } from "@openauthjs/openauth/issuer";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { handle } from "hono/aws-lambda";
import theme from "./theme";
import { subjects } from "./subjects";
import { GoogleProvider } from "@openauthjs/openauth/provider/google";
import { Select } from "@openauthjs/openauth/ui/select";
import * as jose from "jose";
import { Resource } from "sst";
import * as v from "valibot";
import { Effect, pipe } from "effect";
import { users } from "@blank/core/modules";
import { fromParsedEffect } from "@blank/core/lib/effect/index";

const Errors = {
  ProviderNotSupported: (provider: string) =>
    new Error(`Provider ${provider} not supported currently`),
};

const keys = {
  google: {
    clientID: Resource.GoogleOAuth.clientId,
    clientSecret: Resource.GoogleOAuth.clientSecret,
  },
};

const Token = v.string();

const JwtPayload = v.pipe(
  v.object({
    email: v.pipe(v.string(), v.email()),
    email_verified: v.literal(true),
    name: v.string(),
    picture: v.string(),
  }),
  v.transform(({ picture, ...rest }) => ({
    ...rest,
    image: picture,
  })),
);

function decodeJwt(token: string) {
  return pipe(
    Effect.try(() => jose.decodeJwt(token)),
    Effect.mapError((e) => {
      if (e instanceof jose.errors.JWTInvalid) return e;

      return (
        Object.values(jose.errors).find(
          (joseError) => e instanceof joseError,
        ) ?? undefined
      );
    }),
  );
}

function getOrCreateUser(payload: v.InferOutput<typeof JwtPayload>) {
  const result = pipe(
    users.getByEmail(payload.email),
    Effect.catchTag("UserNotFoundError", () =>
      users.create(payload).pipe(Effect.map((user) => user.id)),
    ),
  );

  return result;
}

const app = issuer({
  theme,
  subjects,
  providers: {
    google: GoogleProvider({
      ...keys.google,
      scopes: ["email", "profile"],
    }),
    code: CodeProvider(
      CodeUI({
        async sendCode() {},
      }),
    ),
  },
  select: Select({
    providers: {
      code: { hide: true },
      google: { display: "Google" },
    },
  }),
  success: async (ctx, value) => {
    switch (value.provider) {
      case "google":
        const result = pipe(
          Effect.succeed(value.tokenset.raw.id_token),
          Effect.flatMap((token) => fromParsedEffect(Token, token)),
          Effect.flatMap(decodeJwt),
          Effect.flatMap((decoded) => fromParsedEffect(JwtPayload, decoded)),
          Effect.flatMap(getOrCreateUser),
          Effect.match({
            onSuccess: (id) => {
              return ctx.subject("user", { userID: id }, { subject: id });
            },
            onFailure: (err) => {
              throw err instanceof Error
                ? err
                : new Error("Authentication Error", { cause: err });
            },
          }),
        );

        return Effect.runPromise(result);
      case "code":
      default:
        throw Errors.ProviderNotSupported(value.provider);
    }
  },
});

export default handle(app);
