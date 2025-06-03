// const isDevOrProduction = ["dev", "production"].includes($app.stage);

export function SecretWithEnvFallback(name: string) {
  // Convert PascalCase name to SNAKE_CASE_ALL_CAPS without leading underscore
  const envVarName = name
    .replace(/\.?([A-Z]+)/g, "_$1")
    .replace(/^_/, "")
    .toUpperCase();

  // Use the name for the secret and envVarName for the fallback
  const secret = new sst.Secret(name, process.env[envVarName]);

  return secret.value;
}

const CreateConditional =
  (condition: boolean) =>
  <T>(fn: () => T) =>
    condition ? fn() : undefined;

// const DevelopmentOnly = CreateConditional($dev);
export const NonDevelopmentOnly = CreateConditional(!$dev);
export const ProductionStageOnly = CreateConditional(
  $app.stage === "production"
);
