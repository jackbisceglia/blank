export const domain = "withblank.com";

type DomainType = "sub-domain" | "root-domain";
type Stage = "production" | string;

type MakeDomainConfigOpts = {
  type: DomainType;
  stage: Stage;
} & (
  | {
      type: "root-domain";
    }
  | {
      type: "sub-domain";
      name: string;
      fallback?: string;
    }
);

/**
 * Generates a domain configuration object based on the provided options.
 *
 * @param {MakeDomainConfigOpts} opts - Configuration options for generating the domain.
 * @param {DomainType} opts.type - The type of domain to generate: "sub" for a subdomain or "root" for the root domain.
 * @param {string} opts.stage - The deployment stage (e.g., "production", "staging", "development"). Used to determine the subdomain name in non-production environments.
 * @param {string} opts.name - Required when `type` is "sub". A string representing the subdomain name. The subdomain will be `{opts.name}.${domain}`. In non-production environments, the subdomain will be `{opts.name}-{opts.stage}.${domain}`.
 *
 * @returns {{ name: string; dns: sst.cloudflare.dns; }} An object containing the domain name and DNS configuration.
 *
 * @example
 * // Example usage (similar to auth.ts):
 * const authDomainConfig = getDomainConfig({
 *   type: "sub",
 *   name: "auth",
 *   stage: $app.stage,
 * });
 *
 * // In production, this might return:
 * // { name: "auth.withblank.com", dns: sst.cloudflare.dns() }
 *
 * // In a staging environment, this might return:
 * // { name: "auth-staging.withblank.com", dns: sst.cloudflare.dns() }
 */

export const getDomainConfig = (opts: MakeDomainConfigOpts) => {
  const name = (() => {
    switch (opts.type) {
      case "sub-domain":
        const isProduction = opts.stage === "production";

        const subdomain = [!isProduction && opts.stage, opts.name]
          .filter((v) => !!v)
          .join("-");

        return `${subdomain}.${domain}`;
      case "root-domain":
      default:
        return domain;
    }
  })();

  return {
    name,
    dns: sst.cloudflare.dns(),
  };
};

export const domains = {
  web: getDomainConfig({
    type: "root-domain",
    stage: $app.stage,
  }),
  auth: getDomainConfig({
    type: "sub-domain",
    name: "auth",
    stage: $app.stage,
  }),
  sync: getDomainConfig({
    type: "sub-domain",
    name: "sync",
    stage: $app.stage,
  }),
};
