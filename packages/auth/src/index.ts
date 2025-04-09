import { issuer } from "@openauthjs/openauth/issuer";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { handle } from "hono/aws-lambda";
import theme from "./theme";
import { subjects } from "./subjects";
import { GoogleProvider } from "@openauthjs/openauth/provider/google";
import { users } from "@blank/core/db";
import { Select } from "@openauthjs/openauth/ui/select";
import { ok, okAsync, Result } from "neverthrow";
import * as jose from "jose";
import { Resource } from "sst";
import * as v from "valibot";
import { fromParsed, orDefaultError } from "@blank/core/utils";

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
  }))
);

function decodeJwt(token: string) {
  return Result.fromThrowable(jose.decodeJwt)(token).mapErr((e) => {
    return orDefaultError(e as Error, (e) => {
      // either return the error we expect, or if it's still a jose error, then return whatever matches, otherwise undefined to fallback to generic error
      if (e instanceof jose.errors.JWTInvalid) {
        return e;
      }

      return (
        Object.values(jose.errors).find(
          (joseError) => e instanceof joseError
        ) ?? undefined
      );
    });
  });
}

function getOrCreateUser(payload: v.InferOutput<typeof JwtPayload>) {
  return users.getByEmail(payload.email).andThen((user) => {
    if (user) {
      return okAsync(user);
    }

    return users.createUser(payload);
  });
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
      })
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
        const user = await ok(value.tokenset.raw.id_token)
          .andThen((token) => fromParsed(Token, token))
          .andThen(decodeJwt)
          .andThen((decoded) => fromParsed(JwtPayload, decoded))
          .asyncAndThen(getOrCreateUser);

        return user.match(
          function success(user) {
            return ctx.subject(
              "user",
              { userID: user.id },
              { subject: user.id }
            );
          },
          function error(error) {
            throw error;
          }
        );
      case "code":
      default:
        throw Errors.ProviderNotSupported(value.provider);
    }
  },
});

export default handle(app);
