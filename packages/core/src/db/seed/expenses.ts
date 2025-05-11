import { expenses } from "../expense";

const name = ""; // can replace with whatever name of a user is in the group for testing
const placeholder = `John Doe`;

function randomDateLast30Days() {
  const randomDate = new Date();
  randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
  return randomDate;
}

export async function seed() {
  const userId = "4fb3862b-b29c-44b0-9549-7be1cf490305"; // make configurable
  const groupId = "6b28e22a-7f0d-4871-a6d2-7fe135abb382"; // automate

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
  ].map((desc) => desc.replace(placeholder, name));

  for (const description of descriptions) {
    console.log(`Creating expense: ${description}`);
    const result = await expenses.createFromDescription({
      groupId,
      description,
      userId,
      date: randomDateLast30Days(),
    });

    if (result.isErr()) {
      console.error(result.error);
    } else {
      console.log(`Created expense ${JSON.stringify(result.value, null, 2)}`);
    }
  }
}

void seed();
