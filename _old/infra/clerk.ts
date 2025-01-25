export default new sst.Linkable('Clerk', {
  properties: {
    clerkSecretKey: new sst.Secret(
      'ClerkSecretKey',
      process.env.CLERK_SECRET_KEY,
    ).value,
    clerkPublishableKey: new sst.Secret(
      'ClerkPublishableKey',
      process.env.CLERK_PUBLISHABLE_KEY,
    ).value,
    clerkJwks: new sst.Secret('ClerkJWKS', process.env.ZERO_AUTH_JWKS_URL)
      .value,
  },
});
