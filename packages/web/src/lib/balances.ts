import { ExpenseWithParticipants } from "@/pages/_protected/groups/$slug/page";

export function createBalanceMap(expenses: ExpenseWithParticipants[]) {
  function initialize() {
    const map = new Map<string, number>();

    expenses.forEach((expense) => {
      expense.participants.forEach((p) => {
        const balance = map.get(p.userId) ?? 0;

        // split: owed = (1 - split) * amount, owe = (split) * amount
        // delta: owed = positive (they're owed), owe = negative (they owe)
        const [split, delta] =
          p.role === "payer" ? [1 - p.split, 1] : [p.split, -1];

        // For each participant, update their balance:
        //   - If payer: add their share of the amount they are owed (positive)
        //   - If not payer: subtract the share they owe (negative)
        //   - Formula: balance += delta (direction) * split (share) * amount
        map.set(p.userId, balance + delta * split * expense.amount);
      });
    });

    return map;
  }

  const balances = initialize();

  return (id: string) => balances.get(id) ?? 0;
}
