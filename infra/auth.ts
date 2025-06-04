import { AI } from "./ai";
import { Database } from "./database";
import { domains } from "./domain";
import { SecretWithEnvFallback } from "./utils";

const GoogleOAuth = new sst.Linkable("GoogleOAuth", {
  properties: {
    clientId: SecretWithEnvFallback("GoogleOAuthClientId"),
    clientSecret: SecretWithEnvFallback("GoogleOAuthClientSecret"),
  },
});

export const Auth = new sst.aws.Auth("Auth", {
  issuer: {
    handler: "packages/server/auth/src/index.default",
    link: [Database, GoogleOAuth], // TODO: treeshaking issue, need to include ai
  },
  domain: domains.auth,
});

export const getAuthJwksUrl = () =>
  $interpolate`${Auth.url}/.well-known/jwks.json`;
