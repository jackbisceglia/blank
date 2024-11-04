export default {
  nlToTransaction() {
    const rules = [
      "Default paidBy to 'SENDER' if unspecified. Self-referential nouns = SENDER.",
      'Exclude paidBy party from splitWith.',
      'Capitalization should follow standard English capitalization rules. Sentence fragments should be treated as a sentence. If unsure, match input capitalization.',
      "Assume even splits unless specified. Multiply 'each' amounts by participant count. Use 2 decimal places.",
      "Don't include information about timing, location, or vendor description.",
      "Don't include information that isn't about the item purchased. Things like 'with my credt card' or 'the bill' should not be included in the description.",
      "Only fill the amount as an object if there's not a total amount provided. Prefer single number when possible.",
      "However, do not remove the aforementioned details IF it is essential to identifying the transaction. Eg. if buying someone a birthday gift, the person's name should not be removed, because it is essential to what was purchased.",
      ' Do not do any math about splitting costs. If a per-person cost is given, then format the data as per the schema. If a total cost is given, then simply give that value.',
    ];

    return `
        You are a transaction parser.

        Translate the following natural language sentences about transaction splitting into a JSON object that matches the schema.

        Rules:
        ${rules.join('\n')}
      `;
  },
};
