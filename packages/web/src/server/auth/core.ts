import { Tokens } from "@/server/utils";
import { subjects } from "@blank/auth/subjects";
import { createClient } from "@openauthjs/openauth/client";
import { constants } from "@/server/utils";
import { optional } from "@blank/core/lib/utils/index";

export const openauth = createClient({
  clientID: constants.authClientId,
  issuer: constants.authServerUrl,
});

type AuthenticateOptions = {
  bearer?: string;
  cookies?: {
    get: () => { [K in keyof Tokens]: Tokens[K] | undefined };
    set: (tokens: Tokens) => void;
  };
};
/**
 * Verifies if user is authenticated and refreshes tokens if needed
 * @returns Subject if authenticated, false otherwise
 */
export async function authenticate(opts: AuthenticateOptions) {
  const cookies = opts.cookies?.get();

  const access = opts.bearer ?? cookies?.access;
  const refresh = cookies?.refresh;

  if (!access) return null;

  const verified = await openauth.verify(subjects, access, {
    ...optional({ refresh }),
  });

  if (verified.err) return null;

  if (verified.tokens) {
    opts.cookies?.set(verified.tokens);
  }

  return {
    subject: verified.subject,
    tokens: verified.tokens,
  };
}
