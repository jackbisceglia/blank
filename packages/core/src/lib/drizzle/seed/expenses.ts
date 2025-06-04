import { Effect, pipe } from "effect";
import { expenses } from "../../../modules/expense/entity";

const name = "jenna"; // can replace with whatever name of a user is in the group for testing
const placeholder = `John Doe`;

async function seed() {
  const userId = "e39c4049-d908-45ec-bd03-879d4f33ac27"; // make configurable
  const groupId = "e4949a1b-109f-45df-b279-e92687818628"; // automate

  // a bunch of ai generated expense split descriptions
  const descriptions = [
    "Split dinner with John Doe, cost $42",
    "John Doe paid for coffee, $8",
    "Covered movie tickets for me and John Doe, $28",
    "John Doe bought groceries, $65",
    "Shared Uber ride with John Doe, $18",
    "John Doe paid for lunch, $56",
    "John Doe bought concert tickets for us, $120",
    "Split Airbnb with John Doe, $210",
    "John Doe paid for taxi fare, $35",
    "Split utility bills with John Doe, $180",
    "Bought party supplies with John Doe, $95",
    "Split brunch with John Doe, $75",
    "Paid for museum tickets with John Doe, $32",
    "Covered parking fees with John Doe, $24",
    "Split gym membership with John Doe, $85",
    "Shared Netflix subscription with John Doe, $15",
    "Paid for bowling with John Doe, $45",
    "Split weekend getaway with John Doe, $350",
    "Covered spa day with John Doe, $160",
    "Split furniture purchase with John Doe, $280",
    "Paid for cooking class with John Doe, $90",
    "Split pet supplies with John Doe, $75",
    "Split kayak rental with John Doe, $60",
    "Paid for escape room with John Doe, $85",
    "Covered wine tasting with John Doe, $95",
    "Split board game night with John Doe, $45",
    "Shared bike rental with John Doe, $40",
    "Paid for pottery class with John Doe, $110",
    "Split beach equipment with John Doe, $65",
    "Covered theme park tickets with John Doe, $220",
    "Split home repair supplies with John Doe, $175",
    "Paid for dance class with John Doe, $70",
    "Split sushi dinner with John Doe, $52",
    "John Doe paid for yoga class, $22",
    "Bought camping gear with John Doe, $130",
    "John Doe covered brunch, $48",
    "Split paddleboard rental with John Doe, $55",
    // "John Doe paid for ice cream, $14",
    // "Covered escape room with John Doe, $92",
    // "Split hotel room with John Doe, $180",
    // "John Doe paid for gas, $40",
    // "Split groceries with John Doe, $120",
    // "Bought hiking passes with John Doe, $36",
    // "Split pizza night with John Doe, $33",
    // "Paid for art supplies with John Doe, $60",
    // "Covered comedy show with John Doe, $75",
    // "Split car rental with John Doe, $200",
    // "John Doe paid for zoo tickets, $28",
    // "Split festival tickets with John Doe, $150",
    // "Bought picnic supplies with John Doe, $27",
    // "Split ski lift tickets with John Doe, $210",
    // "John Doe paid for hot springs, $38",
    // "Covered mini golf with John Doe, $22",
    // "Split escape room with John Doe, $80",
    // "Paid for aquarium tickets with John Doe, $44",
    // "Split dinner cruise with John Doe, $160",
    // "John Doe paid for bowling, $36",
    // "Bought board games with John Doe, $58",
    // "Split spa treatment with John Doe, $120",
    // "Covered pottery class with John Doe, $95",
    // "Split amusement park with John Doe, $230",
    // "John Doe paid for breakfast, $19",
    // "Split movie snacks with John Doe, $21",
    // "Bought running shoes with John Doe, $110",
    // "Split escape room with John Doe, $90",
  ].map((desc) => desc.replace(placeholder, name));

  const result = Effect.forEach(
    descriptions,
    (description, index) => {
      return pipe(
        Effect.log(`Creating expense: ${description}`),
        Effect.flatMap(() =>
          expenses.createFromDescription({
            groupId,
            description,
            userId,
            date: new Date(2025, 4, 1 + Math.floor(index / 2)),
          })
        ),
        Effect.tapBoth({
          onFailure: (error) =>
            Effect.logError(`Failed creating expnse: ${error.message}`),
          onSuccess: (result) =>
            Effect.log(`Created expense: ${JSON.stringify(result, null, 2)}`),
        }),
        Effect.ignore
      );
    },
    { concurrency: 3 }
  );

  return Effect.runPromise(result);
}

void seed();
