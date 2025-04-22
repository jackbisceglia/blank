import { Tokens } from "@/server/utils";
import { subjects } from "@blank/auth/subjects";
import { createClient } from "@openauthjs/openauth/client";
import { constants } from "@/server/utils";

export const openauth = createClient({
  clientID: constants.authClientId,
  issuer: constants.authServerUrl,
});

type AuthenticateOptions = {
  cookies: {
    get: () => Partial<Tokens>;
    set: (tokens: Tokens) => void;
  };
};
/**
 * Verifies if user is authenticated and refreshes tokens if needed
 * @returns Subject if authenticated, false otherwise
 */
export async function authenticate(opts: AuthenticateOptions) {
  const { access, refresh } = opts.cookies.get();

  if (!access) return null;

  const verified = await openauth.verify(subjects, access, { refresh });

  if (verified.err) return null;

  if (verified.tokens) {
    opts.cookies.set(verified.tokens);
  }

  return {
    subject: verified.subject,
    tokens: verified.tokens,
  };
}
