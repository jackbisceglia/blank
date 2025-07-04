import { Effect, pipe } from "effect";
import { expenses } from "../../../modules/expense/entity";

const name = "jenna"; // can replace with whatever name of a user is in the group for testing
const placeholder = `John Doe`;

async function seed() {
  const userId = "e9a8dfe7-6040-4bf5-8b0a-a45a158b85eb"; // make configurable
  const groupId = "e33412b4-13af-442a-b3db-aced14326ebe"; // automate

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
          }),
        ),
        Effect.tapBoth({
          onFailure: (error) =>
            Effect.logError(`Failed creating expnse: ${error.message}`),
          onSuccess: (result) =>
            Effect.log(`Created expense: ${JSON.stringify(result, null, 2)}`),
        }),
        Effect.ignore,
      );
    },
    { concurrency: 3 },
  );

  return Effect.runPromise(result);
}

void seed();
