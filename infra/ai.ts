import { SecretWithEnvFallback } from "./utils";

export const AI = new sst.Linkable("AI", {
  properties: {
    // logging/eval
    braintrustApiKey: SecretWithEnvFallback("BraintrustApiKey"),

    // model providers
    openaiApiKey: SecretWithEnvFallback("OpenaiApiKey"),
    googleGenerativeAiApiKey: SecretWithEnvFallback("GoogleGenerativeAiApiKey"),
    groqApiKey: SecretWithEnvFallback("GroqApiKey"),
  },
});
