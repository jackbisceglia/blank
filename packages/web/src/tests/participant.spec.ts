import { Member } from "@blank/core/modules/member/schema";
import { compareParticipantsCustomOrder } from "@/lib/participants";
import { describe, it, expect } from "bun:test";
import { withBalance } from "@/lib/balances";
import { pipe, Array, Number } from "effect";

// sort order:
// 1. positive balances first, descending
// 2. negative balances first, descending by absolute value
// 3. zero balances last
const MEMBER: Member = {
  groupId: Date.now().toString(),
  userId: Date.now().toString(),
  nickname: "MOCK_USER",
};

function sortWithTransformations(input: number[]) {
  return pipe(
    input,
    Array.map((balance) => withBalance(MEMBER, balance)),
    Array.sortBy((a, b) =>
      Number.sign(compareParticipantsCustomOrder(a.balance, b.balance)),
    ),
    Array.map((member) => member.balance),
  );
}

describe("Sort participants by balance in custom sort order", () => {
  const mixed: { in: number[]; out: number[] }[] = [
    {
      in: [100, -100, 0],
      out: [100, -100, 0],
    },
    {
      in: [100, -100, 0, 50, -50, 0],
      out: [100, 50, -100, -50, 0, 0],
    },
    {
      in: [0, -100, 100, 10, 40, -50, 0],
      out: [100, 40, 10, -100, -50, 0, 0],
    },
    {
      in: [1983, -2, 381, 1000, 1002, -1, 0, 0, 1983],
      out: [1983, 1983, 1002, 1000, 381, -2, -1, 0, 0],
    },
  ];

  it.each(mixed)(
    "Should sort correctly when balances inputs are mixed",
    ({ in: INPUT, out: EXPECTED }) => {
      const balances = sortWithTransformations(INPUT);

      expect(balances).toEqual(EXPECTED);
    },
  );

  it("Should sort correctly when balances are all positive", () => {
    const INPUT = [4321, 157, 2999, 4800, 75, 2048];
    const EXPECTED = [4800, 4321, 2999, 2048, 157, 75];

    const balances = sortWithTransformations(INPUT);

    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly when balances are all negative", () => {
    const INPUT = [-487, -3201, -59, -4021, -1500, -2999];
    const EXPECTED = [-4021, -3201, -2999, -1500, -487, -59];

    const balances = sortWithTransformations(INPUT);

    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly when balances are all zero", () => {
    const INPUT = [0, 0, 0, 0, 0, 0];
    const EXPECTED = [0, 0, 0, 0, 0, 0];

    const balances = sortWithTransformations(INPUT);

    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly when balances has 1 item", () => {
    const INPUT = [100];
    const EXPECTED = [100];

    const balances = sortWithTransformations(INPUT);

    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly when balances has 2 items", () => {
    const INPUT = [100, -100];
    const EXPECTED = [100, -100];

    const balances = sortWithTransformations(INPUT);

    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly when balances have duplicate values", () => {
    const INPUT = [100, 100, -100, -100, 0, 0];
    const EXPECTED = [100, 100, -100, -100, 0, 0];

    const balances = sortWithTransformations(INPUT);
    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly with large and small numbers", () => {
    const INPUT = [Infinity, -Infinity, 0, 1, -1];
    const EXPECTED = [Infinity, 1, -Infinity, -1, 0];

    const balances = sortWithTransformations(INPUT);
    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly with floating point numbers", () => {
    const INPUT = [1.5, -2.3, 0, 3.7, -0.1];
    const EXPECTED = [3.7, 1.5, -2.3, -0.1, 0];

    const balances = sortWithTransformations(INPUT);
    expect(balances).toEqual(EXPECTED);
  });

  it("Should sort correctly with negative zero and zero", () => {
    const INPUT = [0, -0, 1, -1];
    // JS treats 0 and -0 as equal in sort, so both will be at the end
    const EXPECTED = [1, -1, 0, -0];

    const balances = sortWithTransformations(INPUT);
    expect(balances).toEqual(EXPECTED);
  });
});
