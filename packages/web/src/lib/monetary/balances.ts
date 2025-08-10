import { ExpenseWithParticipants } from "@/pages/_protected/groups/$slug_id/page";
import { Member } from "@blank/zero";
import { Match, Number, pipe } from "effect";
import { fraction, PERCENTAGE_SUM_ERROR_MARGIN } from "./fractions";
import { ParticipantWithMember } from "../participants";

export type MemberWithBalance = Member & { balance: number };
export type Balances = {
  get: (id: string) => number;
  map: Map<string, number>;
};

export function createBalanceMap(
  expenses: ExpenseWithParticipants[],
): Balances {
  function initialize() {
    const map: Balances["map"] = new Map();

    expenses.forEach((expense) => {
      expense.participants.forEach((p) => {
        const s = fraction().from(...p.split);
        const balance = map.get(p.userId) ?? 0;

        // split: owed = (1 - split) * amount, owe = (split) * amount
        // delta: owed = positive (they're owed), owe = negative (they owe)
        const [split, delta] = p.role === "payer" ? [s.inverse(), 1] : [s, -1];

        // For each participant, update their balance:
        //   - If payer: add their share of the amount they are owed (positive)
        //   - If not payer: subtract the share they owe (negative)
        //   - Formula: balance += delta (direction) * split (share) * amount
        map.set(p.userId, balance + split.apply(delta * expense.amount));
      });
    });

    return map;
  }

  const map = initialize();

  return {
    get: (id: string) => map.get(id) ?? 0,
    map,
  };
}

export function withBalance(
  member: Member,
  balance: number,
): MemberWithBalance {
  return { ...member, balance };
}

type Creditor = MemberWithBalance;
type Debtor = MemberWithBalance;

type Splits = [Creditor[], Debtor[]];

function split(members: readonly Member[], balances: Balances): Splits {
  return members.reduce<[Creditor[], Debtor[]]>(
    (arrays, member) => {
      const mapped = withBalance(member, balances.get(member.userId));

      const array = pipe(
        mapped,
        (member) => member.balance,
        Match.value,
        Match.when(Number.greaterThan(0), () => arrays[0]),
        Match.when(Number.lessThan(0), () => arrays[1]),
        Match.orElse(() => undefined),
      );

      array?.push(mapped);

      return arrays;
    },
    [[], []],
  );
}

export type Settlement = {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
};

export function calculateSettlements(
  members: readonly Member[],
  balances: Balances,
): Settlement[] {
  const [creditors, debtors] = split(members, balances);

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  const settlements: Settlement[] = [];

  let [i, j] = [0, 0];

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const owe = -debtor.balance;
    const amount = Math.min(owe, creditor.balance);
    if (amount <= 0) break;
    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(amount * 100) / 100,
      fromName: debtor.nickname,
      toName: creditor.nickname,
    });
    debtor.balance += amount;
    creditor.balance -= amount;
    if (Math.abs(debtor.balance) < 1e-6) i++;
    if (Math.abs(creditor.balance) < 1e-6) j++;
  }

  return settlements;
}

export function checkExpenseSplitValidity(
  participants: ParticipantWithMember[],
) {
  const split = participants.reduce((sum, participant) => {
    const [num, denom] = participant.split;

    return sum + num / denom;
  }, 0);

  return Math.abs(split - 1) < PERCENTAGE_SUM_ERROR_MARGIN;
}
