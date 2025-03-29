import { issuer } from "@openauthjs/openauth/issuer";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { handle } from "hono/aws-lambda";
import theme from "./theme";
import { subjects } from "./subjects";
import { GoogleProvider } from "@openauthjs/openauth/provider/google";
import { users } from "@blank/core/db";
import { Select } from "@openauthjs/openauth/ui/select";
import { type } from "arktype";
import { err, ok, okAsync, Result } from "neverthrow";
import * as jose from "jose";
import { Resource } from "sst";

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

const DecodedJWTPayloadSchema = type({
  email: "string",
  email_verified: "true",
  name: "string",
  picture: "string",
})
  .omit("email_verified")
  .pipe((o) => {
    const { picture, ...rest } = o;
    const result = { ...rest, image: picture };
    return result;
  });

const TokenSchema = type.string;

function orDefaultError<T>(error: Error, fn: (error: Error) => T | undefined) {
  return fn(error) ?? error;
}

const validateToken = (token: unknown) => {
  const validated = TokenSchema(token);

  if (validated instanceof type.errors) {
    return err(new Error(validated.summary));
  }

  return ok(validated);
};

const validatePayload = (payload: jose.JWTPayload) => {
  const validated = DecodedJWTPayloadSchema(payload); // validate this DecodedJWTPayloadSchema

  if (validated instanceof type.errors) {
    return err(new Error(validated.summary));
  }

  return ok(validated);
};

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

function getOrCreateUser(payload: typeof DecodedJWTPayloadSchema.infer) {
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
          .andThen(validateToken)
          .andThen(decodeJwt)
          .andThen(validatePayload)
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
