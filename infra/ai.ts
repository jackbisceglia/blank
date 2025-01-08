export default new sst.Linkable('AI', {
  properties: {
    openaiApiKey: new sst.Secret('OpenaiApiKey', process.env.OPENAI_API_KEY)
      .value,
    mistralApiKey: new sst.Secret('MistralApiKey', process.env.MISTRAL_API_KEY)
      .value,
    anthropicApiKey: new sst.Secret(
      'AnthropicApiKey',
      process.env.ANTHROPIC_API_KEY,
    ).value,
  },
});
